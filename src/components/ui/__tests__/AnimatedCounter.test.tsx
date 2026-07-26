import React from 'react';
import { render } from '@testing-library/react-native';
import { AnimatedCounter } from '../AnimatedCounter';
import { PaperProvider } from 'react-native-paper';

describe('AnimatedCounter', () => {
  it('renders the initial value', () => {
    const { getByText } = render(
      <PaperProvider>
        <AnimatedCounter value={10} />
      </PaperProvider>
    );

    expect(getByText('10')).toBeTruthy();
  });

  it('renders correctly with string value', () => {
    const { getByText } = render(
      <PaperProvider>
        <AnimatedCounter value="50+" />
      </PaperProvider>
    );

    expect(getByText('50+')).toBeTruthy();
  });

  it('applies custom variant', () => {
    const { getByText } = render(
      <PaperProvider>
        <AnimatedCounter value={100} variant="displayLarge" />
      </PaperProvider>
    );
    
    expect(getByText('100')).toBeTruthy();
  });
});
