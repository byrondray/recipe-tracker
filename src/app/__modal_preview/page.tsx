'use client';

import { useState } from 'react';
import { DeleteConfirmModal } from '../components/deleteConfirmModal';

export default function ModalPreview() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center'>
      <button onClick={() => setOpen(true)}>Open</button>
      <DeleteConfirmModal
        open={open}
        title='Delete "Spaghetti Carbonara"?'
        loading={loading}
        onConfirm={() => setLoading((l) => !l)}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
