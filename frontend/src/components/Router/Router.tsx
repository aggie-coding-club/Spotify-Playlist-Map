import {
  IconBook,
  IconChartPie3,
  IconChevronDown,
  IconCode,
  IconCoin,
  IconFingerprint,
  IconNotification,
} from '@tabler/icons-react';
import {
  Anchor,
  Box,
  Burger,
  Button,
  Center,
  Collapse,
  Divider,
  Drawer,
  Group,
  HoverCard,
  ScrollArea,
  SimpleGrid,
  Text,
  ThemeIcon,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Router.module.css'

export function Router() {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

  return (
    <Box pb={120}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%">
          <a href="/" className={classes.link}>
            <Text fw={700} size="xl" c="black" style={{ fontFamily: "serif", fontStyle: "italic" }}>vibemap</Text>
          </a>
          

          <Group h="100%" gap={0} visibleFrom="sm">
            <a href="/musicmap" className={classes.link}>
              Get Started
            </a>
            <a href="#" className={classes.link}>
              Features
            </a>
            <a href="#" className={classes.link}>
              About
            </a>
            <a href="#" className={classes.link}>
              Contact
            </a>
          </Group>

          <Group visibleFrom="sm">
            <Button variant="default" radius="xl">Log in</Button>
          </Group>
        </Group>
      </header>
    </Box>
  );
}