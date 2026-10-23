import type { FormEventHandler, ReactNode } from "react";
import { Modal } from "./ui";

type ConfirmModalProps = {
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: FormEventHandler<HTMLFormElement>;
  confirming: boolean;
  confirmLabel: string;
  confirmingLabel: string;
  confirmDisabled?: boolean;
  children?: ReactNode;
};

export function ConfirmModal({
  title,
  description,
  onClose,
  onConfirm,
  confirming,
  confirmLabel,
  confirmingLabel,
  confirmDisabled = false,
  children,
}: ConfirmModalProps) {
  function handleSubmit(event: Parameters<FormEventHandler<HTMLFormElement>>[0]) {
    event.preventDefault();
    onConfirm(event);
  }

  return (
    <Modal title={title} description={description} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {children}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={confirming}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            type="submit"
            disabled={confirming || confirmDisabled}
          >
            {confirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}