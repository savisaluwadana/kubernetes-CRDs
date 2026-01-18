import kopf
import kubernetes.client
import yaml

# --- 1. Database Handler ---
@kopf.on.create('infra.example.com', 'v1', 'databases')
def create_database(spec, name, namespace, **kwargs):
    engine = spec.get('engine')
    image = "mysql:5.7" if engine == "mysql" else "postgres:13"
    port = 3306 if engine == "mysql" else 5432
    
    # Create Deployment & Service
    deploy = create_deployment(name, image, port, {})
    svc = create_service(name, port)
    
    kopf.adopt(deploy)
    kopf.adopt(svc)
    
    api = kubernetes.client.AppsV1Api()
    core = kubernetes.client.CoreV1Api()
    
    api.create_namespaced_deployment(namespace, deploy)
    core.create_namespaced_service(namespace, svc)
    
    return {'status': 'Running', 'service_dns': f'{name}.{namespace}.svc.cluster.local'}

# --- 2. Backend Handler ---
@kopf.on.create('infra.example.com', 'v1', 'backends')
def create_backend(spec, name, namespace, **kwargs):
    image = spec.get('image')
    db_name = spec.get('connectToDatabase') # <--- "I need to talk to this DB"
    
    # Validate that the DB actually exists!
    if not check_resource_exists("databases", db_name, namespace):
        raise kopf.TemporaryError(f"Database '{db_name}' not ready yet. Waiting...", delay=5)

    # Inject DB Connection Info
    env = [
        {"name": "DB_HOST", "value": db_name},
        {"name": "DB_PORT", "value": "3306"} # Simplified
    ]
    
    deploy = create_deployment(name, image, 8080, env)
    svc = create_service(name, 8080)
    
    kopf.adopt(deploy)
    kopf.adopt(svc)
    
    api = kubernetes.client.AppsV1Api()
    core = kubernetes.client.CoreV1Api()
    
    api.create_namespaced_deployment(namespace, deploy)
    core.create_namespaced_service(namespace, svc)

# --- 3. Frontend Handler ---
@kopf.on.create('infra.example.com', 'v1', 'frontends')
def create_frontend(spec, name, namespace, **kwargs):
    image = spec.get('image')
    be_name = spec.get('connectToBackend') # <--- "I need to talk to this Backend"
    
    env = [{"name": "API_URL", "value": f"http://{be_name}:8080"}]
    
    deploy = create_deployment(name, image, 80, env)
    
    kopf.adopt(deploy)
    kubernetes.client.AppsV1Api().create_namespaced_deployment(namespace, deploy)

# --- Helper Functions ---
def check_resource_exists(plural, name, namespace):
    api = kubernetes.client.CustomObjectsApi()
    try:
        api.get_namespaced_custom_object('infra.example.com', 'v1', namespace, plural, name)
        return True
    except:
        return False

def create_deployment(name, image, port, env_list):
    # (Simplified for brevity - same logic as before)
    return {
        "apiVersion": "apps/v1", "kind": "Deployment",
        "metadata": {"name": name, "labels": {"app": name}},
        "spec": {
            "replicas": 1, "selector": {"matchLabels": {"app": name}},
            "template": {
                "metadata": {"labels": {"app": name}},
                "spec": {"containers": [{"name": "c", "image": image, "env": env_list if env_list else []}]}
            }
        }
    }

def create_service(name, port):
    return {
        "apiVersion": "v1", "kind": "Service",
        "metadata": {"name": name},
        "spec": {"selector": {"app": name}, "ports": [{"port": port}]}
    }