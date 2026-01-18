Here is the complete code for "StackBuilder": A Kubernetes-native Self-Service Portal.

Project Structure
Create a folder named StackBuilder and organize your files like this:

Plaintext

StackBuilder/
├── requirements.txt      # Python dependencies
├── crds.yaml             # Kubernetes Custom Resource Definitions
├── operator.py           # The Backend Engine (Kopf)
└── portal.py             # The Frontend UI (Flask)
1. Setup Dependencies (requirements.txt)
Create this file and install the libraries.

Plaintext

kopf
kubernetes
flask
pyyaml
Run in terminal:

Bash

pip install -r requirements.txt
2. The Rules (crds.yaml)
These define the three "Lego Blocks" our platform supports.

YAML

apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.stack.example.com
spec:
  group: stack.example.com
  names:
    kind: Database
    plural: databases
    shortNames: ["db"]
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                engine:
                  type: string
                  enum: ["mysql", "postgres", "mongo"]
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: backends.stack.example.com
spec:
  group: stack.example.com
  names:
    kind: Backend
    plural: backends
    shortNames: ["be"]
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                stack:
                  type: string
                  enum: ["node", "python", "php"]
                connectToDatabase:
                  type: string
---
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: frontends.stack.example.com
spec:
  group: stack.example.com
  names:
    kind: Frontend
    plural: frontends
    shortNames: ["fe"]
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                framework:
                  type: string
                  enum: ["react", "nextjs", "vue"]
                connectToBackend:
                  type: string
Apply them:

Bash

kubectl apply -f crds.yaml
3. The Engine (operator.py)
This script watches Kubernetes for new requests and spins up the correct Docker containers.

Note: Since we aren't deploying real source code, I have added a sleep 3600 command to the App containers so they stay "Running" (Green) instead of crashing.

Python

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
4. The Portal (portal.py)
This runs the Web UI. It authenticates using your local kubeconfig and submits the forms to the API.

Python

from flask import Flask, render_template_string, request, jsonify
from kubernetes import client, config

app = Flask(__name__)

# Connect to K8s
try:
    config.load_kube_config() # Works for local dev (Docker Desktop/Minikube)
except:
    config.load_incluster_config() # Works if deployed inside K8s

crd_api = client.CustomObjectsApi()

HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>StackBuilder IDP</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #eef2f5; display: flex; justify-content: center; height: 100vh; align-items: center; margin: 0; }
        .container { background: white; width: 400px; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #2c3e50; font-size: 24px; margin-bottom: 25px; }
        .group { margin-bottom: 20px; }
        label { display: block; font-weight: 600; color: #34495e; margin-bottom: 8px; }
        select, input { width: 100%; padding: 10px; border: 1px solid #dcdcdc; border-radius: 6px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #3498db; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.3s; }
        button:hover { background: #2980b9; }
        .status { margin-top: 15px; text-align: center; font-size: 14px; color: #27ae60; min-height: 20px;}
        .section-title { font-size: 12px; text-transform: uppercase; color: #95a5a6; letter-spacing: 1px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;}
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ StackBuilder</h1>
        
        <div class="group">
            <label>Project Name</label>
            <input type="text" id="name" placeholder="e.g. startup-v1">
        </div>

        <div class="section-title">Database Layer</div>
        <div class="group">
            <select id="db">
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mongo">MongoDB</option>
            </select>
        </div>

        <div class="section-title">Backend Layer</div>
        <div class="group">
            <select id="backend">
                <option value="python">Python</option>
                <option value="node">Node.js</option>
                <option value="php">PHP</option>
            </select>
        </div>

        <div class="section-title">Frontend Layer</div>
        <div class="group">
            <select id="frontend">
                <option value="react">React</option>
                <option value="nextjs">Next.js</option>
                <option value="vue">Vue.js</option>
            </select>
        </div>

        <button onclick="deploy()">🚀 Launch Stack</button>
        <div class="status" id="status"></div>
    </div>

    <script>
        async function deploy() {
            const name = document.getElementById('name').value;
            if(!name) return alert("Please name your project");
            
            const btn = document.querySelector('button');
            const status = document.getElementById('status');
            
            btn.disabled = true;
            btn.innerText = "Provisioning Infrastructure...";
            status.innerText = "";

            const payload = {
                name: name,
                db: document.getElementById('db').value,
                be: document.getElementById('backend').value,
                fe: document.getElementById('frontend').value
            };

            try {
                const res = await fetch('/deploy', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                status.innerText = data.message;
            } catch(e) {
                status.innerText = "Error: " + e;
                status.style.color = "red";
            } finally {
                btn.disabled = false;
                btn.innerText = "🚀 Launch Stack";
            }
        }
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML)

@app.route('/deploy', methods=['POST'])
def deploy():
    data = request.json
    p_name = data['name']
    
    group = "stack.example.com"
    version = "v1"
    namespace = "default"

    # 1. Define CRDs
    db_cr = {
        "apiVersion": f"{group}/{version}",
        "kind": "Database",
        "metadata": {"name": f"{p_name}-db"},
        "spec": {"engine": data['db']}
    }

    be_cr = {
        "apiVersion": f"{group}/{version}",
        "kind": "Backend",
        "metadata": {"name": f"{p_name}-api"},
        "spec": {
            "stack": data['be'],
            "connectToDatabase": f"{p_name}-db"
        }
    }

    fe_cr = {
        "apiVersion": f"{group}/{version}",
        "kind": "Frontend",
        "metadata": {"name": f"{p_name}-ui"},
        "spec": {
            "framework": data['fe'],
            "connectToBackend": f"{p_name}-api"
        }
    }

    # 2. Submit to K8s
    try:
        crd_api.create_namespaced_custom_object(group, version, namespace, "databases", db_cr)
        crd_api.create_namespaced_custom_object(group, version, namespace, "backends", be_cr)
        crd_api.create_namespaced_custom_object(group, version, namespace, "frontends", fe_cr)
        return jsonify({"message": f"Success! {p_name} is launching..."})
    except Exception as e:
        return jsonify({"message": f"Failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting IDP Portal on http://localhost:5000")
    app.run(port=5000, debug=True)
5. How to Run the Full Project
You need two separate terminals.

Terminal 1: The Operator (The Infrastructure Team) This process simulates the platform engineers making sure the automation runs.

Bash

kopf run operator.py
Terminal 2: The Portal (The Developer Experience) This process runs the website.

Bash

python portal.py
The Final Test
Open your browser to http://localhost:5000.

Name: super-app.

Select: MySQL, Python, React.

Click Launch.

Watch Terminal 1 (Operator) scroll with logs like: Creating deployment super-app-db...

Check your cluster:

Bash

kubectl get pods
You will see the 3 pods (Frontend, Backend, DB) initializing automatically.