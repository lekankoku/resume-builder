import React from 'react';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import { cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { A4_HEIGHT, colors, MARGIN } from './theme';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    top: A4_HEIGHT - MARGIN / 2 - 4,
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: { fontSize: 8.5, color: colors.muted },
});

const PageFooter: React.FC<{ website: string }> = ({ website }) => (
  <View fixed style={styles.footer}>
    <Link src={cleanUrl(website)} style={styles.text}>
      {displayUrl(website)}
    </Link>
    <Text style={styles.text} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

export default PageFooter;
