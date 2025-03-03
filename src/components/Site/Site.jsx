// Import External Dependencies
import { Fragment, useEffect, useState } from 'react';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Outlet,
} from 'react-router-dom';
import PropTypes from 'prop-types';
import { MDXProvider } from '@mdx-js/react';

// Import Utilities
import {
  extractPages,
  extractSections,
  getPageDescription,
  getPageTitle,
} from '../../utilities/content-utils.mjs';
import isClient from '../../utilities/is-client';
import getAdjacentPages from '../../utilities/get-adjacent-pages/index.mjs';

// Import Components
import NotificationBar from '../NotificationBar/NotificationBar';
import Navigation from '../Navigation/Navigation';
import SidebarMobile from '../SidebarMobile/SidebarMobile';
import Container from '../Container/Container';
import Splash from '../Splash/Splash';
import Sponsors from '../Sponsors/Sponsors';
import Sidebar from '../Sidebar/Sidebar';
import Footer from '../Footer/Footer';
import Page from '../Page/Page';
import PageNotFound from '../PageNotFound/PageNotFound';
import Vote from '../Vote/Vote';
import Badge from '../Badge/Badge.js';
import StackBlitzPreview from '../StackBlitzPreview/StackBlitzPreview';
import { default as LinkComponent } from '../mdxComponents/Link';
import { Helmet } from 'react-helmet-async';

import Favicon from '../../favicon.ico';
import Logo from '../../assets/logo-on-white-bg.svg';
import OgImage from '../../assets/icon-pwa-512x512.png';

// Load Styling
import '../../styles/index';
import './Site.scss';

// Load Content Tree
import Content from '../../_content.json';

import clientSideRedirections from './clientSideRedirections';

const mdxComponents = {
  Badge: Badge,
  StackBlitzPreview: StackBlitzPreview,
  a: LinkComponent,
};

Site.propTypes = {
  import: PropTypes.func,
};
function Site(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /**
   * Toggle the mobile sidebar
   *
   */
  const _toggleSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  /**
   * Strip any non-applicable properties
   *
   * @param  {array} array - ...
   * @return {array}       - ...
   */
  const _strip = (array) => {
    let anchorTitleIndex = array.findIndex(
      (item) => item.name.toLowerCase() === 'index.mdx'
    );

    if (anchorTitleIndex !== -1) {
      array.unshift(array[anchorTitleIndex]);

      array.splice(anchorTitleIndex + 1, 1);
    }

    const map = new Map([
      ['concepts', '概念'],
      ['configuration', '配置'],
      ['guides', '指南'],
      ['loaders', 'loader'],
      ['migrate', '迁移'],
      ['plugins', 'plugin'],
    ]);
    return array
      .map(({ title, name, url, group, sort, anchors, children }) => {
        const cnTitle = map.get(title) || map.get(name);
        return {
          title: cnTitle || title || name,
          content: cnTitle || title || name,
          url,
          group,
          sort,
          anchors,
          children: children ? _strip(children) : [],
        };
      })
      .filter(
        (page) =>
          page.title !== 'printable.mdx' && !page.content.includes('Printable')
      );
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      if (process.env.NODE_ENV === 'production') {
        // only register sw.js in production
        if ('serviceWorker' in navigator) {
          // dynamic load sw
          import('workbox-window/Workbox.mjs').then(({ Workbox }) => {
            const wb = new Workbox('/sw.js');

            // listen to `waiting` event
            wb.addEventListener('waiting', () => {
              // log and show updateBox
              console.log(
                // eslint-disable-next-line
                "A new service worker has installed, but it can't activate until all tabs running the current version have been unloaded"
              );
            });

            // register the service worker
            wb.register();
          });
        }
      }
    }
  }, []);

  let sections = extractSections(Content);
  let section = sections.find(({ url }) => location.pathname.startsWith(url));
  let pages = extractPages(Content);
  const sidebarPages = _strip(
    section
      ? section.children
      : Content.children.filter(
          (item) => item.type !== 'directory' && item.url !== '/'
        )
  );

  // not to show in sub navbar
  const excludeItems = ['contribute', 'blog'];

  const title = getPageTitle(Content, location.pathname);

  const description =
    getPageDescription(Content, location.pathname) ||
    'webpack 是一个模块打包器。它的主要目标是将 JavaScript 文件打包在一起，打包后的文件用于在浏览器中使用，但它也能够胜任转换（transform）、打包（bundle）或包裹（package）任何资源(resource or asset)。';

  function isPrintPage(url) {
    return url.includes('/printable');
  }

  // As github pages uses trailing slash, we need to provide it to canonicals for consistency
  // between canonical href and final url served by github pages.
  function enforceTrailingSlash(url) {
    return url.replace(/\/?$/, '/');
  }

  // Enable client side redirection
  // See https://github.com/webpack/webpack.js.org/pull/5146#discussion_r663510210
  useEffect(() => {
    const target = clientSideRedirections(location);
    if (target) {
      navigate(target, { replace: true });
    }
  }, [location, navigate]);

  return (
    <MDXProvider components={mdxComponents}>
      <div className="site">
        <Helmet>
          <html lang="zh-cmn-Hans" />
          <meta charset="utf-8" />
          <meta name="theme-color" content="#2B3A42" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {isPrintPage(location.pathname) ? (
            <meta name="robots" content="noindex,nofollow" />
          ) : null}
          <title>{title}</title>
          <meta name="description" content={description} />
          <meta property="og:site_name" content="webpack" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={title} />
          <meta
            property="og:description"
            name="description"
            content={description}
          />
          <meta
            property="og:image"
            content={`https://webpack.js.org${OgImage}`}
          />
          <meta property="twitter:card" content="summary" />
          <meta property="twitter:site" content="@webpack" />
          <meta property="twitter:creator" content="@webpack" />
          <meta property="twitter:domain" content="https://webpack.js.org/" />
          <meta
            name="keywords"
            content="webpack5, webpack, webpack 中文文档, webpack 官方中文, webpack 5 官方中文, 印记中文, docschina, docschina.org, webpack.docschina.org, doc.react-china.org, nodejs.cn, vue.docschina.org, babel.docschina.org, parceljs.docschina.org, rollup.docschina.org, koajs.docschina.org"
          ></meta>
          <link rel="icon" type="image/x-icon" href={Favicon} />
          {process.env.NODE_ENV === 'production' && (
            <link rel="manifest" href="/manifest.json" />
          )}
          <link
            rel="canonical"
            href={`https://webpack.docschina.org${enforceTrailingSlash(
              location.pathname
            )}`}
          />
          <meta name="mobile-web-app-capable" content="yes" />
          <link rel="icon" sizes="192x192" href="/icon_192x192.png" />
          <link rel="icon" sizes="512x512" href="/icon_512x512.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="apple-mobile-web-app-title" content="webpack" />
          <link rel="apple-touch-icon" href="/icon_180x180.png" />
          <link rel="mask-icon" href={Logo} color="#465e69" />
          <meta name="msapplication-TileImage" content="/icon_150x150.png" />
          <meta name="msapplication-TileColor" content="#465e69" />
          <script
            data-ad-client="ca-pub-7556818484543627"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          ></script>
        </Helmet>
        <div className="site__header">
          <Navigation
            pathname={location.pathname}
            hash={location.hash}
            toggleSidebar={_toggleSidebar}
            links={[
              {
                content: '中文文档',
                url: '/concepts/',
                isactive: (_, location) => {
                  return /^\/(api|concepts|configuration|guides|loaders|migrate|plugins)/.test(
                    location.pathname
                  );
                },
                children: _strip(
                  sections.filter(
                    ({ name }) => excludeItems.includes(name) === false
                  )
                ),
              },
              { content: '参与贡献', url: '/contribute/' },
              { content: '投票', url: '/vote/' },
              { content: '博客', url: '/blog/' },
              { content: '印记中文', url: 'https://docschina.org' },
            ]}
          />
        </div>

        {isClient ? (
          <SidebarMobile
            isOpen={mobileSidebarOpen}
            sections={_strip(Content.children)}
            toggle={_toggleSidebar}
          />
        ) : null}

        <Routes>
          <Route index element={<Splash />} />
          <Route
            element={
              <Container className="site__content">
                <Outlet />
              </Container>
            }
          >
            <Route path="vote" element={<Vote />} />
            <Route path="app-shell" element={<Fragment />} />
            {pages.map((page) => {
              let path = page.path.replace('src/content/', '');
              let content = props.import(path);
              const { previous, next } = getAdjacentPages(
                sidebarPages,
                page,
                'url'
              );
              return (
                <Route
                  key={page.url}
                  path={page.url}
                  element={
                    <Fragment>
                      <Sponsors />
                      <Sidebar
                        className="site__sidebar"
                        currentPage={location.pathname}
                        pages={sidebarPages}
                      />
                      <Page
                        {...page}
                        content={content}
                        previous={previous}
                        next={next}
                      />
                    </Fragment>
                  }
                />
              );
            })}
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
        <Footer />
        <NotificationBar />
      </div>
    </MDXProvider>
  );
}
export default Site;
