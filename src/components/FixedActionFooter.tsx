import { Box, Stack } from '@mui/joy';
import type { ReactNode } from 'react';

export function useFixedFooterPadding(rowCount = 2): number {
  return rowCount * 56 + 24;
}

export default function FixedActionFooter({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        bgcolor: 'background.surface',
        borderTop: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        px: 1,
        py: 1,
      }}
    >
      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}
