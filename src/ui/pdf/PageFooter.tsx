import React from 'react';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import { cleanUrl, displayUrl } from '../../domain/resume/contactFormat';
import { A4_HEIGHT, colors } from './theme';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    top: A4_HEIGHT - 34,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: { fontSize: 7, color: colors.muted },
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
