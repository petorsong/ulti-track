import { CssVarsProvider } from '@mui/joy/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddPlayerModal } from './PlayerRosterModals';

function renderAddPlayerModal(
  props: Partial<React.ComponentProps<typeof AddPlayerModal>> = {}
) {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(
    <CssVarsProvider>
      <AddPlayerModal
        open
        onClose={onClose}
        teamType="Mixed"
        onSave={onSave}
        {...props}
      />
    </CssVarsProvider>
  );
  return { onSave, onClose };
}

describe('AddPlayerModal', () => {
  it('defaults to open (isFMP false) with switch on O', async () => {
    const user = userEvent.setup();
    const { onSave } = renderAddPlayerModal();
    expect(screen.getByRole('switch', { name: 'Gender' })).toBeChecked();

    await user.type(screen.getByPlaceholderText('Player name'), 'Sam');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Sam',
      type: 'Cutter',
      isFMP: false,
    });
  });

  it('saves isFMP true when gender switch is on F', async () => {
    const user = userEvent.setup();
    const { onSave } = renderAddPlayerModal();

    await user.type(screen.getByPlaceholderText('Player name'), 'Sam');
    await user.click(screen.getByRole('switch', { name: 'Gender' }));
    expect(screen.getByRole('switch', { name: 'Gender' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onSave).toHaveBeenCalledWith({
      firstName: 'Sam',
      type: 'Cutter',
      isFMP: true,
    });
  });

  it('hides gender switch for non-mixed teams', () => {
    renderAddPlayerModal({ teamType: 'Open' });
    expect(screen.queryByRole('switch', { name: 'Gender' })).not.toBeInTheDocument();
  });
});
