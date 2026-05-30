import { CssVarsProvider } from '@mui/joy/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PlayerButton from './PlayerButton';

function renderButton(props: Partial<React.ComponentProps<typeof PlayerButton>> = {}) {
  const onClick = vi.fn();
  render(
    <CssVarsProvider>
      <PlayerButton
        firstName="Alex"
        nickname={null}
        type="Handler"
        variant="outlined"
        colour="primary"
        onClick={onClick}
        {...props}
      />
    </CssVarsProvider>
  );
  return { onClick };
}

describe('PlayerButton', () => {
  it('shows nickname when provided', () => {
    renderButton({ nickname: 'Ace' });
    expect(screen.getByRole('button', { name: /Ace/i })).toBeInTheDocument();
  });

  it('shows firstName when nickname is null', () => {
    renderButton();
    expect(screen.getByRole('button', { name: /Alex/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const { onClick } = renderButton();
    await user.click(screen.getByRole('button', { name: /Alex/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is set', () => {
    renderButton({ disabled: true });
    expect(screen.getByRole('button', { name: /Alex/i })).toBeDisabled();
  });
});
