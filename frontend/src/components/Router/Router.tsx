import { Box, Button, Group, Text } from '@mantine/core';
import classes from './Router.module.css'

// the height of header is 3.75 rem
export function Router() {
  return (
    <Box pb={0}> 
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
            <a href="/about" className={classes.link}>
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