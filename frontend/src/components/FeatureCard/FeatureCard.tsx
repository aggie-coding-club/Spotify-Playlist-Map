import { Card, Grid, Title, Flex } from '@mantine/core';
import { ReactNode, CSSProperties, MouseEvent } from 'react';

interface FeatureCardProps {
  title: string;
  span?: number | { base?: number; xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  children?: ReactNode;
  style?: CSSProperties;
  icon?: ReactNode;
  onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  span, 
  children, 
  style = {}, 
  icon,
  onMouseEnter,
  onMouseLeave
}) => (
  <Grid.Col span={span} >
      <Card 
        radius="md" 
        padding="md" 
        withBorder={false}
        shadow="md"
        style={{
          height: '100%',
          width: '15rem', 
          transition: 'all 0.3s ease',
          ...style
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Flex align="center" gap="xs" mb="md">
          <Title size="1.2rem">{title}</Title>
          {icon}
        </Flex>
        {children}
      </Card>
  </Grid.Col>
);