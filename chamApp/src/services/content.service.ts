import { useCallback } from 'react';
import api from '../lib/axiosInstance.ts';
import { useRequest } from '../hooks/useRequest.ts';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus.ts';
import { useContentStore, type Content } from '../store';

async function withImageUrls(contents: Content[]) {
  const imageUrls = await Promise.all(
    contents.map(content =>
      content.imageFileId
        ? api
            .get(`/api/download-file/${content.imageFileId}`)
            .then(res => res.data.data as string)
            .catch(() => null)
        : Promise.resolve(null),
    ),
  );

  return contents.map((content, index) => ({
    ...content,
    imageUrl: imageUrls[index],
  }));
}

export function useFetchContents() {
  const { request } = useRequest();
  const setContents = useContentStore(state => state.setContents);

  const fetchContents = useCallback(() => {
    request(
      () =>
        api
          .get('/api/contents/')
          .then(res => {
            const contents = res.data.data as Content[];
            console.log('[contents] response', contents);
            console.log(
              '[contents] IN_APP_POPUP',
              contents.filter(content => content.contentType === 'IN_APP_POPUP'),
            );
            return contents;
          })
          .then(withImageUrls)
          .then(contents => {
            console.log('[contents] with image urls', contents);
            return contents;
          }),
      setContents,
      {
        ignoreErrorRedirect: true,
      },
    );
  }, [request, setContents]);

  useRefreshOnFocus(fetchContents);
}
