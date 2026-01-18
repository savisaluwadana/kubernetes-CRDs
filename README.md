# kubernetes-CRDs
this repo contains practice crds that can be implemented in a kubernetes cluster 

Prerequisites
Before starting, open your terminal and install the tools we need:

Bash

# 1. Install the Kubernetes Python library and Kopf framework
pip install kopf kubernetes

# 2. Make sure your cluster is running (Minikube/Docker Desktop)
kubectl cluster-info
Project 1: The "Mini-RDS" Operator (Database-as-a-Service)
The Goal: Developers in your company shouldn't worry about creating Deployments, Services, Secrets, and PVCs just to get a database. They should just ask for a MySQL database, and your Operator should build the entire infrastructure for them.

Step 1: The "Order Form" (CRD)
Create mysql-crd.yaml. This tells Kubernetes to accept "MySQL" objects.

YAML

apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: mysqls.database.example.com
spec:
  group: database.example.com
  names:
    kind: MySQL
    plural: mysqls
    shortNames: ["my"]
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
                storage_size:
                  type: string
Apply it: kubectl apply -f mysql-crd.yaml

Step 2: The Controller (Python)
Create mysql_operator.py. This is the brain. It watches for a MySQL object and automatically creates the Deployment, Service, and PVC.

Python

import kopf
import kubernetes.client
from kubernetes.client.rest import ApiException
import yaml
import os

@kopf.on.create('database.example.com', 'v1', 'mysqls')
def create_fn(spec, name, namespace, logger, **kwargs):
    size = spec.get('storage_size', '1Gi')
    
    # Define the "Child" objects we want to create
    
    # 1. The Persistent Volume Claim (Hard Drive)
    pvc_body = yaml.safe_load(f"""
        apiVersion: v1
        kind: PersistentVolumeClaim
        metadata:
          name: mysql-pvc-{name}
        spec:
          accessModes: [ "ReadWriteOnce" ]
          resources:
            requests:
              storage: {size}
    """)

    # 2. The Deployment (The Database)
    deploy_body = yaml.safe_load(f"""
        apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: mysql-deploy-{name}
          labels:
            app: mysql-{name}
        spec:
          replicas: 1
          selector:
            matchLabels:
              app: mysql-{name}
          template:
            metadata:
              labels:
                app: mysql-{name}
            spec:
              containers:
              - name: mysql
                image: mysql:5.7
                env:
                - name: MYSQL_ROOT_PASSWORD
                  value: "supersecret"
                ports:
                - containerPort: 3306
                volumeMounts:
                - name: mysql-store
                  mountPath: /var/lib/mysql
              volumes:
              - name: mysql-store
                persistentVolumeClaim:
                  claimName: mysql-pvc-{name}
    """)

    # 3. The Service (Network Access)
    svc_body = yaml.safe_load(f"""
        apiVersion: v1
        kind: Service
        metadata:
          name: mysql-service-{name}
        spec:
          selector:
            app: mysql-{name}
          ports:
          - port: 3306
            targetPort: 3306
    """)

    # Adopt the children! 
    # This means if you delete the MySQL object, K8s deletes the PVC/Deployment automatically.
    kopf.adopt(pvc_body)
    kopf.adopt(deploy_body)
    kopf.adopt(svc_body)

    # Actually talk to the API to create them
    api = kubernetes.client.CoreV1Api()
    apps_api = kubernetes.client.AppsV1Api()

    try:
        api.create_namespaced_persistent_volume_claim(namespace, pvc_body)
        apps_api.create_namespaced_deployment(namespace, deploy_body)
        api.create_namespaced_service(namespace, svc_body)
        return {'status': 'Database Created', 'connection': f'mysql-service-{name}:3306'}
    except ApiException as e:
        raise kopf.PermanentError(f"Failed to create resources: {e}")
Step 3: Run the Operator
Open a terminal and run this command. It will connect to your local cluster and start watching.

Bash

kopf run mysql_operator.py --verbose
Step 4: Test it (The User Experience)
Open a new terminal. Act as the developer. Create my-db.yaml:

YAML

apiVersion: database.example.com/v1
kind: MySQL
metadata:
  name: project-alpha
spec:
  storage_size: 2Gi
Apply it: kubectl apply -f my-db.yaml

Result:

Look at your operator terminal: You will see it reacting to the event.

Check your cluster: kubectl get all

You will see a Deployment mysql-deploy-project-alpha

You will see a Service mysql-service-project-alpha

You will see a PVC mysql-pvc-project-alpha

Magic Moment: Delete the custom resource: kubectl delete mysql project-alpha

Watch as everything (Deployment, Service, PVC) disappears automatically. That is the power of kopf.adopt.

Project 2: The "Chaos Monkey" (Day-2 Operations)
The Goal: Project 1 was about creating things. Project 2 is about managing things. We will create a Chaos resource. When you create it, the operator will find a victim Pod in the target namespace and delete it to test if your app self-heals.

Step 1: The CRD
Create chaos-crd.yaml.

YAML

apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: chaosmonkeys.ops.example.com
spec:
  group: ops.example.com
  names:
    kind: ChaosMonkey
    plural: chaosmonkeys
    shortNames: ["chaos"]
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
                target_app_label:
                  type: string
Apply it: kubectl apply -f chaos-crd.yaml

Step 2: The Chaos Controller
Create chaos_operator.py.

Python

import kopf
import kubernetes.client
import random
import time

@kopf.on.create('ops.example.com', 'v1', 'chaosmonkeys')
def kill_random_pod(spec, namespace, logger, **kwargs):
    target_label = spec.get('target_app_label')
    
    if not target_label:
        raise kopf.PermanentError("You must provide a target_app_label")

    api = kubernetes.client.CoreV1Api()
    
    # 1. Find the pods
    pods = api.list_namespaced_pod(namespace, label_selector=f"app={target_label}")
    
    if len(pods.items) == 0:
        logger.info(f"No pods found with label app={target_label}")
        return {'status': 'No Victims Found'}

    # 2. Pick a victim
    victim = random.choice(pods.items)
    victim_name = victim.metadata.name
    
    logger.info(f"😈 Chaos Monkey selected victim: {victim_name}")
    
    # 3. Terminate the victim
    api.delete_namespaced_pod(victim_name, namespace)
    
    return {'status': f'Killed {victim_name}'}
Step 3: Run the Operator
Stop the previous operator (Ctrl+C) and run this one:

Bash

kopf run chaos_operator.py --verbose
Step 4: The Chaos Experiment
Create a victim: kubectl create deployment nginx --image=nginx --replicas=3

Verify they are running: kubectl get pods (You see 3 pods).

Unleash the Chaos: Create attack.yaml:

YAML

apiVersion: ops.example.com/v1
kind: ChaosMonkey
metadata:
  name: attack-nginx
spec:
  target_app_label: "nginx"
Apply: kubectl apply -f attack.yaml

Result: Look at your kubectl get pods -w window. You will see one Nginx pod Terminating immediately. Since it is a Deployment, Kubernetes will instantly start a replacement.

Summary
Project 1 showed you the "Builder" pattern: The Operator acts as a factory, abstracting complex YAML into a simple CRD.

Project 2 showed you the "Commander" pattern: The Operator takes an action (Deleting a pod) based on your command.

This is exactly how tools like Prometheus Operator (Project 1 style) and LitmusChaos (Project 2 style) work under the hood.
