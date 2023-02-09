<!-- Generated from README.md.gotmpl -->
<!-- update with yarn charts:docs -->
# cased-shell

![Version: 3.0.0-alpha.3](https://img.shields.io/badge/Version-3.0.0--alpha.3-informational?style=flat-square) ![AppVersion: 3.0.0](https://img.shields.io/badge/AppVersion-3.0.0-informational?style=flat-square)

**Homepage:** <https://cased.com>

## Requirements

| Repository | Name | Version |
|------------|------|---------|
| https://charts.bitnami.com/bitnami | postgresql | 12.1.0 |
| https://helm.releases.hashicorp.com | vault | 0.22.1 |

<!-- Included from INSTALL.md -->
<!-- update with yarn charts:docs -->

## Installation

- The Chart for Cased Shell is distributed as an OCI image. Contact [Cased](https://cased.com) for access to the image.
- Construct a values file using the documentation below as a reference making sure to set `config.key` and `ingress.fqdn` and any other values required for your deployment:
  - `postgresql.*` values influence where relational data is stored.
  - `vault.*` values influence where secrets are stored.
  - `config.objectStorageBackend` influences where object storage is stored.
- Install the Chart using `helm install`, `helm upgrade --install`, or using your preferred CI/CD system.

### Example values files

Simple

```yaml
config:
  key: 476777626aae4d0daea431610c7a09ef

ingress:
  fqdn: shell.example.com
```

AWS EKS, ELB, RDS, and S3

```yaml
config:
  key: 476777626aae4d0daea431610c7a09ef

# Use https://github.com/kubernetes-sigs/aws-load-balancer-controller to route traffic
# Use https://github.com/kubernetes-sigs/external-dns to manage DNS records
ingress:
  enabled: true
  fqdn: helm-alb-example.route53-hosted-zone.example.com
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
    alb.ingress.kubernetes.io/backend-protocol: HTTPS
    alb.ingress.kubernetes.io/target-type: 'ip'
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/healthcheck-path: /v2/_ping

    # ALB idle timeout is 60 seconds by default.
    # You may want to increase this to allow for SSH sessions to be idle for longer.
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=600

    # optional, can be used if certificate autodetection doesn't work or doesn't detect the right cert
    # alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:5938688156789:certificate/59386881-b1dc-43d0-b671-5f7c65a28746

    external-dns.alpha.kubernetes.io/hostname: helm-alb-example.route53-hosted-zone.example.com

# Use an existing RDS instance for relational data
postgresql:
  enabled: false
  auth:
    database: 'cased'
    username: 'cased'
    password: '05c28cf475dc'
  external:
    host: db20221110151837801900000001.kvrpfqcjbhkd.us-west-2.rds.amazonaws.com
    port: 5432

# Configure the application to store session logs in an S3 bucket
config:
  objectStorageBackend: s3

aws:
  s3:
    bucket: example-cased-shell-bucket
  region: us-west-2
  key:
    access: SECRET
    secret: SECRET
```

[ingress-nginx](https://github.com/kubernetes/ingress-nginx) and [cert-manager](https://cert-manager.io/):

```yaml
config:
  secret: 476777626aae4d0daea431610c7a09ef

ingress:
  enabled: true
  fqdn: 'nginx-cased-shell.shell.example.com'
  secretName: 'cased-shell-letsencrypt-production'
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-production
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/backend-protocol: 'HTTPS'
```

<!-- update with yarn charts:docs -->

## Values

| Key | Description | Default | Type |
|-----|-------------|---------|------|
| <a href="./values.yaml#L124">aws.key.access</a> | AWS access key ID to use for object storage. Only used if `objectStorageBackend` is "s3". | `nil` | string |
| <a href="./values.yaml#L126">aws.key.secret</a> | AWS secret access key to use for object storage. Only used if `objectStorageBackend` is "s3". | `nil` | string |
| <a href="./values.yaml#L114">aws.region</a> | AWS region to communicate with, defaults to us-east-1. Only used if `objectStorageBackend` is "s3". | `"us-east-1"` | string |
| <a href="./values.yaml#L117">aws.s3.bucket</a> | AWS S3 bucket name to use for object storage. Only used if `objectStorageBackend` is "s3". | `nil` | string |
| <a href="./values.yaml#L119">aws.s3.endpoint</a> | AWS S3 API endpoint to use, defaults to upstream S3. Only used if `objectStorageBackend` is "s3". | `nil` | string |
| <a href="./values.yaml#L121">aws.s3.signatureVersion</a> | Allows configuring the AWS S3 API signatureVersion if necessary when using a custom implementation. Only used if `objectStorageBackend` is "s3". | `nil` | string |
| <a href="./values.yaml#L72">config.image</a> | Image to use for Cased Shell. | `"ghcr.io/cased/shell:pr-633"` | string |
| <a href="./values.yaml#L75">config.jump</a> | Jump configuration YAML - describe your prompts here. See https://github.com/cased/jump. | `""` | string |
| <a href="./values.yaml#L85">config.jumpResources</a> | Resource requests and limits for the Jump container. | `{}` | object |
| <a href="./values.yaml#L44">config.key</a> | A value to use as the key to sign JWT tokens used in cookies. | `"insecure"` | string |
| <a href="./values.yaml#L69">config.log_level</a> | Set this to 'debug' for more verbose logging. | `"info"` | string |
| <a href="./values.yaml#L80">config.objectStorageBackend</a> | Backend to use for object storage. Defaults to "pvc", which uses values from `persistence.*`. "s3" also supported, which uses values from `aws.s3.*` or access granted via `shell.serviceAccount.name`. | `"pvc"` | string |
| <a href="./values.yaml#L100">config.serviceAccount.annotations</a> | Annotations to add to the service account if one is created. Can be used to associate the created service account with an existing [AWS IAM role](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) or [GCP Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity). | `{}` | object |
| <a href="./values.yaml#L90">config.serviceAccount.create</a> |  | `true` | bool |
| <a href="./values.yaml#L94">config.serviceAccount.name</a> | Name of the service account to use for the shell and jump containers. If you've created a service account with access to your object storage backend, you can use that here. | `nil` | string |
| <a href="./values.yaml#L83">config.shellResources</a> | Resource requests and limits for the Shell container. | `{}` | object |
| <a href="./values.yaml#L87">config.vaultInitResources</a> | Resource requests and limits for the Vault initialization containers. | `{}` | object |
| <a href="./values.yaml#L271">dex.enabled</a> |  | `true` | bool |
| <a href="./values.yaml#L272">dex.image</a> |  | `"ghcr.io/dexidp/dex:v2.35.3"` | string |
| <a href="./values.yaml#L273">dex.resources</a> |  | `{}` | object |
| <a href="./values.yaml#L13">imagePullSecrets</a> | imagePullSecrets added to all in-chart Pod specs. | `[]` | list |
| <a href="./values.yaml#L148">ingress.annotations</a> | Set annotations for your Ingress provider here. | `{}` | object |
| <a href="./values.yaml#L140">ingress.enabled</a> | Set to false to skip the creation of an ingress resource. | `true` | bool |
| <a href="./values.yaml#L142">ingress.fqdn</a> | Hostname to use for the ingress. **Required**. | `"shell.example.com"` | string |
| <a href="./values.yaml#L150">ingress.ingressClassName</a> | Set if required by your Ingress provider. Required if you have more than one IngressClass marked as the default for your cluster. | `nil` | string |
| <a href="./values.yaml#L146">ingress.secretName</a> | Set if your ingress implementation requires a secretName. | `""` | string |
| <a href="./values.yaml#L154">persistence</a> | Persistence settings for object storage. Only used if `shell.objectStorageBackend` is set to "pvc". | `{"accessModes":["ReadWriteOnce"],"annotations":{},"enabled":true,"existingClaim":"","size":"8Gi","storageClass":"","subPath":""}` | object |
| <a href="./values.yaml#L11">podAnnotations</a> | Annotations added to all in-chart Pods. | `{}` | object |
| <a href="./values.yaml#L217">postgresql.auth.database</a> | Name of the database created. Also used in the application's client connection configuration. | `"shell"` | string |
| <a href="./values.yaml#L221">postgresql.auth.password</a> | Password assigned to the created user. Also used in the application's client connection configuration. | `"shell"` | string |
| <a href="./values.yaml#L219">postgresql.auth.username</a> | Name of the user created. Also used in the application's client connection configuration. | `"cased"` | string |
| <a href="./values.yaml#L204">postgresql.enabled</a> | Creates a PostgreSQL deployment for storing the application's relational data using a subchart. If disabled, `postgresql.auth.*` and `postgresql.external.*` must be set to connect to an existing PostgreSQL database. | `true` | bool |
| <a href="./values.yaml#L225">postgresql.external.host</a> | External PostgreSQL database host. Required if `postgresql.enabled` is false. | `""` | string |
| <a href="./values.yaml#L227">postgresql.external.port</a> | External PostgreSQL database port. Required if `postgresql.enabled` is false. | `""` | string |
| <a href="./values.yaml#L233">postgresql.persistence</a> | PostgreSQL Primary persistence configuration | `{"accessModes":["ReadWriteOnce"],"annotations":{},"dataSource":{},"enabled":true,"existingClaim":"","labels":{},"mountPath":"/bitnami/postgresql","selector":{},"size":"8Gi","storageClass":"","subPath":""}` | object |
| <a href="./values.yaml#L230">postgresql.service.type</a> |  | `"ClusterIP"` | string |
| <a href="./values.yaml#L207">postgresql.sslMode</a> | Configures PostgreSQL client [ssl mode](https://www.postgresql.org/docs/current/libpq-ssl.html#LIBPQ-SSL-SSLMODE-STATEMENTS) | `"prefer"` | string |
| <a href="./values.yaml#L213">postgresql.tls.autoGenerated</a> | Generates automatically self-signed TLS certificates for the embedded PostgreSQL deployment if enabled. | `true` | bool |
| <a href="./values.yaml#L211">postgresql.tls.enabled</a> | Controls the TLS config of the embedded PostgreSQL deployment. | `true` | bool |
| <a href="./values.yaml#L8">rbac.create</a> | Disable to skip the creation of Roles and RoleBindings for the optional SSHD deployment. | `true` | bool |
| <a href="./values.yaml#L136">service.annotations</a> | Set annotations on the created service if required. | `{}` | object |
| <a href="./values.yaml#L132">service.port</a> | Backend port to use for the service. Change to 8888 if you require HTTP. | `8443` | int |
| <a href="./values.yaml#L134">service.protocol</a> | Protocol to use for the service. Change to http to use port 8888 above. | `"https"` | string |
| <a href="./values.yaml#L130">service.type</a> | Type of service to create. | `"ClusterIP"` | string |
| <a href="./values.yaml#L166">sshd.enabled</a> | Set to false to skip the creation of a SSHD service. | `true` | bool |
| <a href="./values.yaml#L173">sshd.image</a> | Image to use for the included endpoint. This image runs an OpenSSH server and contains an `app` user configured to automatically allow connections that include a valid certificate singed by your Cased Shell CA. `kubectl` is included, and `/etc/profile.d/k8s.sh` configures it for in-cluster access. To include your own utilities or configure access to your own cluster, you may use this image as a base image and refer to your customized image here. | `"ghcr.io/cased/sshd-demo:pr-633"` | string |
| <a href="./values.yaml#L175">sshd.resources</a> | Resource requests and limits for the SSHD container. | `{}` | object |
| <a href="./values.yaml#L194">sshd.role.rules</a> | The rules to apply to the role created for the SSHD service account. This role is only created if `rbac.create` is enabled. | `[{"apiGroups":[""],"resources":["pods"],"verbs":["get","list"]}]` | list |
| <a href="./values.yaml#L189">sshd.serviceAccount.annotations</a> | Annotations to add to the service account if one is created. Can be used to associate the created service account with an existing [AWS IAM role](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) or [GCP Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity). | `{}` | object |
| <a href="./values.yaml#L179">sshd.serviceAccount.create</a> | Specifies whether a ServiceAccount should be created. | `true` | bool |
| <a href="./values.yaml#L183">sshd.serviceAccount.name</a> | The name of the ServiceAccount to use. If not set and create is true, a name is generated using the fullname template. | `nil` | string |
| <a href="./values.yaml#L248">vault</a> | Configures secret storage using vault subchart. | `{"enabled":true,"injector":{"enabled":false},"secretName":"","server":{"authDelegator":{"enabled":false},"dataStorage":{"accessMode":"ReadWriteOnce","annotations":{},"enabled":true,"mountPath":"/vault/data","size":"10Gi","storageClass":null},"standalone":{"enabled":true}}}` | object |
| <a href="./values.yaml#L250">vault.enabled</a> | Deploy vault subchart. | `true` | bool |
| <a href="./values.yaml#L254">vault.secretName</a> | Name of secret containing VAULT_ADDR and VAULT_TOKEN. Required if enabled is false. If not set and enabled is true, a name is generated using the fullname template. | `""` | string |

