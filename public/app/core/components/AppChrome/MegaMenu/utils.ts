import { locationUtil, NavModelItem } from '@grafana/data';
import { config, reportInteraction } from '@grafana/runtime';
import { t } from 'app/core/internationalization';

import { ShowModalReactEvent } from '../../../../types/events';
import appEvents from '../../../app_events';
import { getFooterLinks } from '../../Footer/Footer';
import { HelpModal } from '../../help/HelpModal';

export const enrichHelpItem = (helpItem: NavModelItem) => {
  let menuItems = helpItem.children || [];

  if (helpItem.id === 'help') {
    const onOpenShortcuts = () => {
      appEvents.publish(new ShowModalReactEvent({ component: HelpModal }));
    };
    helpItem.children = [
      ...menuItems,
      ...getFooterLinks(),
      ...getEditionAndUpdateLinks(),
      {
        id: 'keyboard-shortcuts',
        text: t('nav.help/keyboard-shortcuts', 'Keyboard shortcuts'),
        icon: 'keyboard',
        onClick: onOpenShortcuts,
      },
    ];
  }
  return helpItem;
};

export const enrichWithInteractionTracking = (item: NavModelItem, megaMenuDockedState: boolean) => {
  // creating a new object here to not mutate the original item object
  const newItem = { ...item };
  const onClick = newItem.onClick;
  newItem.onClick = () => {
    reportInteraction('grafana_navigation_item_clicked', {
      path: newItem.url ?? newItem.id,
      menuIsDocked: megaMenuDockedState,
    });
    onClick?.();
  };
  if (newItem.children) {
    newItem.children = newItem.children.map((item) => enrichWithInteractionTracking(item, megaMenuDockedState));
  }
  return newItem;
};

export const isMatchOrChildMatch = (itemToCheck: NavModelItem, searchItem?: NavModelItem) => {
  return Boolean(itemToCheck === searchItem || hasChildMatch(itemToCheck, searchItem));
};

export const hasChildMatch = (itemToCheck: NavModelItem, searchItem?: NavModelItem): boolean => {
  return Boolean(
    itemToCheck.children?.some((child) => {
      if (child === searchItem) {
        return true;
      } else {
        return hasChildMatch(child, searchItem);
      }
    })
  );
};

const stripQueryParams = (url?: string) => {
  return url?.split('?')[0] ?? '';
};

const isBetterMatch = (newMatch: NavModelItem, currentMatch?: NavModelItem) => {
  const currentMatchUrl = stripQueryParams(currentMatch?.url);
  const newMatchUrl = stripQueryParams(newMatch.url);
  return newMatchUrl && newMatchUrl.length > currentMatchUrl?.length;
};

/**
 * Mapping of page ID -> ID of corresponding nav tree link to highlight when on that ID's URL
 *
 * Until we have more structured routing in place, we can't rely on the route URLs to determine the necessary
 * `MegaMenuItem` to highlight. This is because the URLs aren't all consistent, and rather than change the URLs
 * we can instead define overrides to make sure any outliers work correctly
 *
 * e.g. within Alerting, the silences page is `/alerting/silences`, but the page to create a new silence is
 * `/alerting/silence/new`. This means it's neater to override certain URLs for now rather than trying to
 * match parts of the beginning of the URL
 *
 */
const overrides: Record<string, string> = {
  'silence-new': 'silences',
  'silence-edit': 'silences',
  'alert-rule-add': 'alert-list',
  'alert-rule-view': 'alert-list',
  'org-new': 'global-orgs',
};

export const getActiveItem = (
  navTree: NavModelItem[],
  pathname: string,
  currentBestMatch?: NavModelItem,
  pageNav?: NavModelItem
): NavModelItem | undefined => {
  const dashboardLinkMatch = '/dashboards';
  const override = pageNav?.id && overrides[pageNav.id];

  for (const link of navTree) {
    const linkWithoutParams = stripQueryParams(link.url);
    const linkPathname = locationUtil.stripBaseFromUrl(linkWithoutParams);

    if (override && override === link.id) {
      currentBestMatch = link;
      break;
    }

    if (linkPathname && link.id !== 'starred') {
      if (linkPathname === pathname) {
        // exact match
        currentBestMatch = link;
        break;
      } else if (linkPathname !== '/' && pathname.startsWith(linkPathname)) {
        // partial match
        if (isBetterMatch(link, currentBestMatch)) {
          currentBestMatch = link;
        }
      } else if (linkPathname === dashboardLinkMatch && pathname.startsWith('/d/')) {
        // dashboard match
        // TODO refactor routes such that we don't need this custom logic
        if (isBetterMatch(link, currentBestMatch)) {
          currentBestMatch = link;
        }
      }
    }
    if (link.children) {
      currentBestMatch = getActiveItem(link.children, pathname, currentBestMatch, pageNav);
    }
    if (stripQueryParams(currentBestMatch?.url) === pathname) {
      return currentBestMatch;
    }
  }
  return currentBestMatch;
};

export function getEditionAndUpdateLinks(): NavModelItem[] {
  const { buildInfo, licenseInfo } = config;
  const stateInfo = licenseInfo.stateInfo ? ` (${licenseInfo.stateInfo})` : '';
  const links: NavModelItem[] = [];

  links.push({
    target: '_blank',
    id: 'version',
    text: `${buildInfo.edition}${stateInfo}`,
    url: licenseInfo.licenseUrl,
    icon: 'external-link-alt',
  });

  if (buildInfo.hasUpdate) {
    links.push({
      target: '_blank',
      id: 'updateVersion',
      text: `New version available!`,
      icon: 'download-alt',
      url: 'https://grafana.com/grafana/download?utm_source=grafana_footer',
    });
  }

  return links;
}
