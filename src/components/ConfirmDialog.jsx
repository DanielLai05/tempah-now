// Custom confirmation dialog component
import React from "react";
import { Modal, Button } from "react-bootstrap";

export const ConfirmDialog = ({ show, onConfirm, onCancel, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "primary" }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title || "Confirm Action"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Hook for using confirm dialog
export const useConfirmDialog = () => {
  const [show, setShow] = React.useState(false);
  const [config, setConfig] = React.useState({});

  const confirm = (config) => {
    return new Promise((resolve) => {
      setConfig({
        ...config,
        onConfirm: () => {
          setShow(false);
          resolve(true);
        },
        onCancel: () => {
          setShow(false);
          resolve(false);
        },
      });
      setShow(true);
    });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog show={show} {...config} />
  );

  return { confirm, ConfirmDialogComponent };
};

