#!/bin/bash

# standard bash error handling
set -o errexit;
set -o pipefail;
set -o nounset;
# debug commands
set -x;

NO_BUILD=${1:-0}
CLEANUP_ONLY=${2:-0}
BIN_DIR="/tmp/kind"
KIND="${BIN_DIR}/kind"
CHRONO_PID="/tmp/chronograf.pid"
CWD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
RWD="$(git rev-parse --show-toplevel)"
LOG="${RWD}/out.log"
KIND_CONFIG="${RWD}/.github/workflows/resources/kind-config.yaml"
KUBE_CONFIG="${CWD}/kube-config"

# cleanup on exit (useful for running locally)
cleanup() {
    "${KIND}" delete cluster || true
    [[ -f ${CHRONO_PID} ]] && kill "$(cat ${CHRONO_PID})" && rm -rf "${CHRONO_PID}"
    rm -rf "${BIN_DIR}" "${KUBE_CONFIG}" "${LOG}"
}

# util to install a released kind version into ${BIN_DIR}
install_kind_release() {
    mkdir -p "${BIN_DIR}"
    VERSION="v0.11.1"
    KIND_BINARY_URL="https://github.com/kubernetes-sigs/kind/releases/download/${VERSION}/kind-linux-amd64"
    wget -O "${KIND}" "${KIND_BINARY_URL}"
    chmod +x "${KIND}"
}

build_chronograf() {
    make -C "${RWD}" clean
    make -C "${RWD}"
    nohup "${RWD}/chronograf" > "${LOG}" 2>&1 & echo $! > "${CHRONO_PID}"
    sleep 5
    echo -e "Chronograf status: $(curl -Isk "http://localhost:8888" | head -n 1)"
    cat "${RWD}/out.log" || exit 0
}

deploy_influxdb_ent() {
#    kubectl apply --validate=false -f https://github.com/jetstack/cert-manager/releases/download/v1.5.4/cert-manager.yaml
    helm repo add jetstack https://charts.jetstack.io
    helm repo add influxdata https://helm.influxdata.com/
    helm repo update
    helm upgrade --wait --install \
        cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.5.4 \
        --set prometheus.enabled=false \
        --set webhook.timeoutSeconds=30 \
        --set installCRDs=true
    kubectl apply -f "${RWD}/.github/workflows/resources/test-reources.yaml"
    kubectl create secret generic influxdb-license --from-literal=INFLUXDB_ENTERPRISE_LICENSE_KEY="${LICENSE_KEY}"
    helm upgrade --wait --install influxdb influxdata/influxdb-enterprise --namespace default --set-string envFromSecret=influxdb-license --set-string data.service.type=NodePort
    kubectl patch svc influxdb-influxdb-enterprise-data --type=json -p '[{"op":"replace","path":"/spec/ports/0/nodePort","value":30086}]'
    kubectl get configmap/influxdb-influxdb-enterprise-data -o  yaml > influxdb-influxdb-enterprise-data-patch
    sed -in 's|\[http\]|[http]\\nflux-enabled = true|' influxdb-influxdb-enterprise-data-patch
    docker cp influxdb-influxdb-enterprise-data-patch kind-control-plane:/
    kubectl patch configmap influxdb-influxdb-enterprise-data --patch-file influxdb-influxdb-enterprise-data-patch
    docker restart kind-control-plane
    rm influxdb-influxdb-enterprise-data-patch influxdb-influxdb-enterprise-data-patchn
    sleep 5
    echo -e "InfluxDB data node status: $(curl -Isk "https://localhost:8086/ping" | head -n 1)"
}

main() {
    cleanup
    if [[ "${CLEANUP_ONLY}" == 0 ]]; then
        LICENSE_KEY=${INFLUXDB_ENTERPRISE_LICENSE_KEY:?}
        docker rm -fv kind-control-plane
        install_kind_release
        "${KIND}" create cluster --wait 60s --loglevel=debug --config "${KIND_CONFIG}" --kubeconfig "${KUBE_CONFIG}"
        export KUBECONFIG="${KUBE_CONFIG}"
        kubectl -n kube-system rollout restart deployment coredns
        deploy_influxdb_ent
        if [[ "${NO_BUILD}" == 0 ]]; then
            build_chronograf
        fi
    fi
}

main