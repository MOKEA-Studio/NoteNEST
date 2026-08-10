import { useState } from "react";
import { trashApi } from "../api";

export default function useTrash({ onRestore, setError }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadTrash() {
    setLoading(true);
    try {
      setPages(await trashApi.list());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function restorePage(id) {
    try {
      const restored = await trashApi.restore(id);
      setPages((current) => current.filter((page) => page.id !== id));
      onRestore(restored);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function removePage(id) {
    try {
      await trashApi.remove(id);
      setPages((current) => current.filter((page) => page.id !== id));
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function emptyTrash() {
    try {
      await trashApi.empty();
      setPages([]);
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  return { pages, loading, loadTrash, restorePage, removePage, emptyTrash };
}
