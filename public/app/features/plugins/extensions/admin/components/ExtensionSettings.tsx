import { css, cx } from '@emotion/css';
import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import { useObservable } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { reactivePluginExtensionRegistry } from 'app/features/plugins/extensions/reactivePluginExtensionRegistry';

import { getCoreExtensionPoints, getPluginExtensionPoints } from '../utils';

export default function ExtensionSettings(): ReactElement | null {
  const params = useParams<{ id: string }>();
  const activeExtensionPointId = params.id ? decodeURIComponent(params.id) : null;
  const styles = useStyles2(getStyles);
  const registry = useObservable(reactivePluginExtensionRegistry.asObservable());
  const pluginExtensionPoints = getPluginExtensionPoints(registry);
  const coreExtensionPoints = getCoreExtensionPoints(registry);

  return (
    <div className={styles.container}>
      <div className={styles.leftColumn}>
        <div className={styles.leftColumnGroup}>
          <div className={styles.leftColumnGroupTitle}>Extension points</div>

          {/* Core extension points */}
          <div className={styles.leftColumnGroupSubTitle}>Core</div>
          <div className={styles.leftColumnGroupContent}>
            {coreExtensionPoints.map((extensionPoint) => (
              <a
                href={`/extensions/${encodeURIComponent(extensionPoint.id)}`}
                key={extensionPoint.id}
                className={cx(styles.leftColumnGroupItem, styles.code)}
              >
                {extensionPoint.id}
              </a>
            ))}
          </div>

          {/* Plugin extension points */}
          <div className={styles.leftColumnGroupSubTitle}>Plugins</div>
          <div className={styles.leftColumnGroupContent}>
            {pluginExtensionPoints.length === 0 && (
              <div className={styles.leftColumnGroupItemNotFound}>No extensions.</div>
            )}
            {pluginExtensionPoints.map((extensionPoint) => (
              <a
                href={`/extensions/${encodeURIComponent(extensionPoint.id)}`}
                key={extensionPoint.id}
                className={cx(styles.leftColumnGroupItem, styles.code)}
              >
                {extensionPoint.id}
              </a>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className={styles.leftColumnGroup}>
          <div className={styles.leftColumnGroupTitle}>Capabilities</div>
          <div className={styles.leftColumnGroupSubTitle}>Grafana ML App</div>
          <div className={styles.leftColumnGroupContent}>
            <div className={styles.leftColumnGroupCapabilityItem}>predict()</div>
            <div className={styles.leftColumnGroupCapabilityItem}>predictWeek()</div>
          </div>
        </div>
      </div>
      {/* Right column */}
      <div className={styles.rightColumn}>
        {!activeExtensionPointId && <div>Select an extension point to view its extensions.</div>}
        {activeExtensionPointId && (
          <div>
            <div>Extensions for {activeExtensionPointId}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    min-height: 400px;
  `,
  leftColumn: css`
    width: 300px;
    padding: ${theme.spacing(2)};
    background-color: ${theme.colors.background.secondary};
  `,
  leftColumnGroup: css`
    border-top: 2px solid ${theme.colors.border.weak};
    margin-top: ${theme.spacing(2)};
    padding-top: ${theme.spacing(2)};

    &:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
  `,
  leftColumnGroupTitle: css`
    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.primary};
  `,
  leftColumnGroupSubTitle: css`
    &:not(:first-child) {
      margin-top: ${theme.spacing(2)};
    }

    font-weight: ${theme.typography.fontWeightBold};
    color: ${theme.colors.text.secondary};
    padding-left: ${theme.spacing(2)};
  `,
  leftColumnGroupItem: css`
    display: inline-block;
    color: ${theme.colors.text.secondary};
    padding-left: ${theme.spacing(4)};
    font-size: ${theme.typography.pxToRem(13)};
  `,
  leftColumnGroupItemNotFound: css`
    display: inline-block;
    color: ${theme.colors.text.disabled};
    padding-left: ${theme.spacing(4)};
    font-size: ${theme.typography.pxToRem(12)};
  `,
  leftColumnGroupCapabilityItem: css`
    cursor: pointer;
    padding-left: ${theme.spacing(4)};
    color: ${theme.colors.text.secondary};
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.pxToRem(12)};
  `,
  code: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    font-size: ${theme.typography.pxToRem(11)};
  `,
  leftColumnGroupContent: css``,
  rightColumn: css`
    flex-grow: 1;
    padding: ${theme.spacing(2)};
  `,
});
