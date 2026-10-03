/* @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../client/src/components/ConfirmationModal.jsx';

const sampleRequest = {
  customer_name: 'Jane Doe',
  requested_service: 'Website Development',
  scheduled_date: '2026-10-15',
};

describe('ConfirmationModal', () => {
  test('does not render when show is false', () => {
    render(
      <ConfirmationModal
        show={false}
        request={sampleRequest}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    expect(screen.queryByText(/Convert to Work Item/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jane Doe/i)).not.toBeInTheDocument();
  });

  test('renders request details when show is true', () => {
    render(
      <ConfirmationModal
        show={true}
        request={sampleRequest}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Website Development/i)).toBeInTheDocument();
    expect(screen.getByText(/Convert to Work Item/i)).toBeInTheDocument();
  });

  test('onConfirm is NOT called on initial render (API not pre-triggered)', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmationModal
        show={true}
        request={sampleRequest}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test('calls onCancel when Cancel button is clicked', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmationModal
        show={true}
        request={sampleRequest}
        onConfirm={jest.fn()}
        onCancel={onCancel}
        loading={false}
      />
    );
    fireEvent.click(screen.getByText(/^Cancel$/i));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('calls onConfirm when Create Work Item button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmationModal
        show={true}
        request={sampleRequest}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
        loading={false}
      />
    );
    fireEvent.click(screen.getByText(/^Create Work Item$/i));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('Create Work Item button is disabled when loading is true', () => {
    render(
      <ConfirmationModal
        show={true}
        request={sampleRequest}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
        loading={true}
      />
    );
    // When loading, button shows "Creating..." text and is disabled
    const btn = screen.getByRole('button', { name: /creating/i });
    expect(btn).toBeDisabled();
  });
});
