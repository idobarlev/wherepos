// Constants
import { tabsSet, batDir } from "constants";

// Utilities
import {
  runBatOnRepos,
  openFileExplorer,
  getValidDirectory,
  getReposWithDirectories,
} from "utilities";

// Dl
import { getFavorites, updateFavorites } from "dl/repos";
import { getDirectories, updateDirectories } from "dl/directories";

// Components
import { ProblemPopup } from "components/ProblemPopup/ProblemPopup";

// React
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// TODO -
// 1. Fix first add favorite
// 2. Add debounce for search
// 3. Skeleton for search

const Context = createContext({});
export const useAppProps = () => useContext(Context);

export const AppContext = ({ children }) => {
  const [repos, setRepos] = useState([]);
  const [dirValue, setDirValue] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [tab, setTab] = useState([...tabsSet.values()][0]);
  const [selectedRepos, setSelectedRepos] = useState(new Set());
  const [favoriteRepos, setFavoriteRepos] = useState(new Set());
  const [directories, setDirectories] = useState(new Set());

  const directoriesArr = useMemo(() => [...directories], [directories]);

  useEffect(() => {
    // TODO
    async function fetchData() {
      try {
        const { directories } = await getDirectories();
        setDirectories(new Set(directories));

        const { favorites } = await getFavorites();
        const defaultFavorites = new Set(favorites);
        setFavoriteRepos(defaultFavorites);
        setSelectedRepos(defaultFavorites);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (!directoriesArr.length) {
      return;
    }

    updateDirectories(directoriesArr).catch((err) => console.error(err));

    getReposWithDirectories(directoriesArr)
      .then((res) => setRepos(res))
      .catch((err) => console.error(err));
  }, [directoriesArr]);

  const filteredRepos = useMemo(() => {
    if (search.length < 2) {
      return repos;
    }

    return repos.filter(({ repo }) => repo.includes(search));
  }, [repos, search]);

  const handleSelectRepo = (repoDirectory) => {
    setSelectedRepos((prev) => {
      prev.has(repoDirectory)
        ? prev.delete(repoDirectory)
        : prev.add(repoDirectory);
      return new Set(prev);
    });
  };

  const handleSelectFavorite = (repoDirectory) => {
    setFavoriteRepos((prev) => {
      prev.has(repoDirectory)
        ? prev.delete(repoDirectory)
        : prev.add(repoDirectory);

      updateFavorites([...prev]);
      return new Set(prev);
    });
  };

  const handleChangeTab = (_e, newValue) => {
    setTab(newValue);
  };

  const handleDeleteDirectory = (directory) => {
    setDirectories((prev) => {
      prev.delete(directory);
      return new Set(prev);
    });
  };

  const handleAddDirectory = async (directory) => {
    try {
      const validDirectory = await getValidDirectory(directory);

      return directory !== validDirectory
        ? openExplorer(validDirectory)
            .then(
              (selectedDir) =>
                selectedDir && handleUpdateDirectoriesState(selectedDir)
            )
            .catch((err) => {
              throw new Error(err);
            })
        : handleUpdateDirectoriesState(directory);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  const handleUpdateDirectoriesState = (directory) => {
    setDirectories((prev) => {
      prev.add(directory);
      return new Set(prev);
    });

    setDirValue("");
  };

  const handleChangeSearch = ({ target: { value } }) => {
    setSearch(value);
  };

  const handleOpenRepos = () => {
    runBatOnRepos(selectedRepos, batDir)
      .then(() => setSelectedRepos(new Set()))
      .catch((err) => console.error(err));
  };

  const handleClickFileExplorer = async (directory) => {
    try {
      const validDirectory = await getValidDirectory(directory);
      openExplorer(validDirectory)
        .then(
          (selectedDir) =>
            selectedDir && handleUpdateDirectoriesState(selectedDir)
        )
        .catch((err) => {
          setError(err);
          console.error(err);
        });
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  const openExplorer = async (directory) => {
    try {
      return await openFileExplorer(directory);
    } catch (err) {
      setError(err);
      console.error(err);
    }
  };

  return (
    <Context.Provider
      value={{
        tab,
        search,
        dirValue,
        setDirValue,
        directories,
        selectedRepos,
        favoriteRepos,
        filteredRepos,
        directoriesArr,
        handleOpenRepos,
        handleChangeTab,
        handleSelectRepo,
        handleChangeSearch,
        handleAddDirectory,
        handleSelectFavorite,
        handleDeleteDirectory,
        handleClickFileExplorer,
      }}
    >
      {children}
      <ProblemPopup error={error} handleClose={() => setError(null)} />
    </Context.Provider>
  );
};