import { Box, Stack } from '@mui/joy';
import type { ReactNode } from 'react';

export function useFixedFooterPadding(rowCount = 2): number {
  return rowCount * 56 + 24;
}

export default function FixedActionFooter({
  children,
  fixed = true,
}: {
  children: ReactNode;
  fixed?: boolean;
}) {
  return (
    <Box
      sx={{
        ...(fixed
          ? { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }
          : { flexShrink: 0 }),
        bgcolor: 'background.surface',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: fixed ? '0 -2px 8px rgba(0,0,0,0.08)' : 'none',
        paddingBottom: 'env(safe-area-inset-bottom)',
        px: 1,
        py: 1,
      }}
    >
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}
