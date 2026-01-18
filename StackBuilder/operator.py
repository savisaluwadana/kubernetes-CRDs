import kopf
import kubernetes.client
import yaml

# --- Helper: Create a Standard Deployment ---
def make_deployment(name, image, port, env, labels):
    return {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {"name": name, "labels": labels},
        "spec": {
            "replicas": 1,
            "selector": {"matchLabels": labels},
            "template": {
                "metadata": {"labels": labels},
                "spec": {
                    "containers": [{
                        "name": "app",
                        "image": image,
                        "ports": [{"containerPort": port}],
                        "env": env,
                        # Keeps the pod alive for demo purposes
                        "command": ["/bin/sh", "-c", "echo 'App Running'; sleep 3600"]
                    }]
                }
            }
        }
    }

# --- Helper: Create a Service ---
def make_service(name, port, labels):
    return {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {"name": name, "labels": labels},
        "spec": {
            "selector": labels,
            "ports": [{"port": port, "targetPort": port}]
        }
    }

# --- 1. Database Handler ---
@kopf.on.create('stack.example.com', 'v1', 'databases')
def create_db(spec, name, namespace, **kwargs):
    engine = spec.get('engine')
    
    # Configuration Map
    configs = {
        "mysql":    {"img": "mysql:5.7", "port": 3306, "env": [{"name": "MYSQL_ROOT_PASSWORD", "value": "pass"}]},
        "postgres": {"img": "postgres:13", "port": 5432, "env": [{"name": "POSTGRES_PASSWORD", "value": "pass"}]},
        "mongo":    {"img": "mongo:4.4", "port": 27017, "env": []}
    }
    
    cfg = configs[engine]
    labels = {"app": name, "type": "database"}
    
    # Create Objects
    deploy = make_deployment(name, cfg['img'], cfg['port'], cfg['env'], labels)
    # Remove the 'sleep' command for databases so they run normally
    del deploy['spec']['template']['spec']['containers'][0]['command']
    
    svc = make_service(name, cfg['port'], labels)
    
    # Adopt & Apply
    kopf.adopt(deploy)
    kopf.adopt(svc)
    
    api = kubernetes.client.AppsV1Api()
    core = kubernetes.client.CoreV1Api()
    
    api.create_namespaced_deployment(namespace, deploy)
    core.create_namespaced_service(namespace, svc)

# --- 2. Backend Handler ---
@kopf.on.create('stack.example.com', 'v1', 'backends')
def create_backend(spec, name, namespace, **kwargs):
    stack = spec.get('stack')
    db_name = spec.get('connectToDatabase')
    
    images = {
        "node": "node:14-alpine",
        "python": "python:3.9-slim",
        "php": "php:7.4-apache"
    }
    
    env = [{"name": "DB_HOST", "value": db_name}]
    labels = {"app": name, "type": "backend"}
    
    deploy = make_deployment(name, images[stack], 8080, env, labels)
    svc = make_service(name, 8080, labels)
    
    kopf.adopt(deploy)
    kopf.adopt(svc)
    
    kubernetes.client.AppsV1Api().create_namespaced_deployment(namespace, deploy)
    kubernetes.client.CoreV1Api().create_namespaced_service(namespace, svc)

# --- 3. Frontend Handler ---
@kopf.on.create('stack.example.com', 'v1', 'frontends')
def create_frontend(spec, name, namespace, **kwargs):
    fw = spec.get('framework')
    be_name = spec.get('connectToBackend')
    
    # React/Next/Vue typically run on Node containers
    image = "node:16-alpine"
    
    env = [{"name": "API_URL", "value": f"http://{be_name}:8080"}]
    labels = {"app": name, "type": "frontend"}
    
    deploy = make_deployment(name, image, 3000, env, labels)
    svc = make_service(name, 3000, labels)
    
    kopf.adopt(deploy)
    kopf.adopt(svc)
    
    kubernetes.client.AppsV1Api().create_namespaced_deployment(namespace, deploy)
    kubernetes.client.CoreV1Api().create_namespaced_service(namespace, svc)