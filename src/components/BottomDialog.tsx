import { type ReactNode } from 'react';
import { Modal, ModalDialog } from '@mui/joy';

export default function SelectLineModal({
  open,
  onClose,
  content,
}: {
  open: boolean;
  onClose: () => void;
  content: ReactNode;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog
        aria-labelledby="nested-modal-title"
        sx={(theme) => ({
          [theme.breakpoints.only('xs')]: {
            top: 'unset',
            bottom: 0,
            left: 0,
            right: 0,
            borderRadius: 0,
            transform: 'none',
            maxWidth: 'unset',
          },
        })}
      >
        {content}
      </ModalDialog>
    </Modal>
  );
}
