#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="room-portal-pasori.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/pasori-reader.env"
ENV_EXAMPLE="${SCRIPT_DIR}/pasori-reader.env.example"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"
PYTHON_BIN="$(command -v python3)"
VENV_DIR="${REPO_DIR}/.venv-pasori"
VENV_PYTHON="${VENV_DIR}/bin/python"

echo "[1/5] Installing PaSoRi dependencies..."
sudo apt update
sudo apt install -y python3-pip python3-venv pcscd pcsc-tools libpcsclite-dev

echo "Creating Python virtual environment..."
"${PYTHON_BIN}" -m venv "${VENV_DIR}"
"${VENV_PYTHON}" -m pip install --upgrade pip
"${VENV_PYTHON}" -m pip install pyscard

echo "[2/5] Enabling pcscd..."
sudo systemctl enable --now pcscd

if [ ! -f "${ENV_FILE}" ]; then
  echo "[3/5] Creating ${ENV_FILE}"
  cp "${ENV_EXAMPLE}" "${ENV_FILE}"
else
  echo "[3/5] ${ENV_FILE} already exists"
fi

echo "[4/5] Installing systemd service..."
sudo tee "${SERVICE_PATH}" >/dev/null <<EOF
[Unit]
Description=Room Portal PaSoRi RC-S300 reader
After=network-online.target pcscd.service
Wants=network-online.target pcscd.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${REPO_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${VENV_PYTHON} ${SCRIPT_DIR}/pasori_rcs300_reader.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

if grep -q "replace-with-production-api-key" "${ENV_FILE}"; then
  echo "[5/5] Service installed, but not started yet."
  echo "Edit ${ENV_FILE} and set API_KEY to the same value as Rails production."
  echo "Then run:"
  echo "  sudo systemctl enable --now ${SERVICE_NAME}"
else
  echo "[5/5] Starting service..."
  sudo systemctl enable --now "${SERVICE_NAME}"
  sudo systemctl status "${SERVICE_NAME}" --no-pager
fi
