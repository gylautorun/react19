import './styles/global.scss';
import { RootDocument } from './layouts/RootDocument';
import { resolveRoute } from './routes/index';

export function Root({ url }: { url: URL }) {
  const route = resolveRoute(url);

  return (
    <RootDocument path={route.path} title={route.title}>
      {route.element}
    </RootDocument>
  );
}
