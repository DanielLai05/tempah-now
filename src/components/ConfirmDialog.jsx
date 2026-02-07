// Custom confirmation dialog component
import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

export const ConfirmDialog = ({ show, onConfirm, onCancel, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "primary", loading = false }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton={!loading}>
        <Modal.Title>{title || "Confirm Action"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Deleting...</span>
            </>
          ) : (
            confirmText
          )}
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

