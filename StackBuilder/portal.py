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