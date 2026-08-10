import { useCallback, useState } from "react";
import { foldersApi, tagsApi } from "../api";

export default function useTaxonomy({ setError }) {
  const [folderEntities, setFolderEntities] = useState([]);
  const [tagEntities, setTagEntities] = useState([]);

  const loadTaxonomy = useCallback(async () => {
    try {
      const [folders, tags] = await Promise.all([foldersApi.list(), tagsApi.list()]);
      setFolderEntities(folders);
      setTagEntities(tags);
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [setError]);

  return {
    folderEntities,
    tagEntities,
    setFolderEntities,
    setTagEntities,
    loadTaxonomy,
  };
}
