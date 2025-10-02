import { useState, useEffect } from "react";
import { Tab } from "@/app/types/query";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "@/app/utils/localStorageUtils";

export function useQueryTabs(initialQuery: string) {
  const [queryTabs, setQueryTabs] = useState<Tab[]>(() => {
    const defaultTab = { id: 1, title: "Query 1", query: initialQuery || "" };
    return getLocalStorageItem<Tab[]>("queryTabs", [defaultTab]);
  });

  const [activeTab, setActiveTab] = useState<number>(() => {
    const savedActiveTab = getLocalStorageItem<number>("activeTab", 1);
    const savedTabs = getLocalStorageItem<Tab[]>("queryTabs", [
      { id: 1, title: "Query 1", query: initialQuery || "" },
    ]);
    return savedTabs.some((tab) => tab.id === savedActiveTab)
      ? savedActiveTab
      : savedTabs[0].id;
  });

  // Save tabs to localStorage
  useEffect(() => {
    setLocalStorageItem("queryTabs", queryTabs);
  }, [queryTabs]);

  // Save active tab to localStorage
  useEffect(() => {
    setLocalStorageItem("activeTab", activeTab);
  }, [activeTab]);

  const handleTabClick = (id: number) => {
    setActiveTab(id);
  };

  const handleTabClose = (id: number) => {
    if (queryTabs.length === 1) return;
    const newTabs = queryTabs.filter((tab) => tab.id !== id);
    setQueryTabs(newTabs);
    if (activeTab === id) {
      setActiveTab(newTabs[0].id);
    }
  };

  const handleTabReorder = (newTabs: Tab[]) => {
    setQueryTabs(newTabs);
  };

  const addNewTab = () => {
    const newId = Math.max(...queryTabs.map((tab) => tab.id), 0) + 1;
    const newTab = { id: newId, title: `Query ${newId}`, query: "" };
    setQueryTabs([...queryTabs, newTab]);
    setActiveTab(newId);
  };

  const updateTabQuery = (id: number, query: string) => {
    setQueryTabs((prevTabs) =>
      prevTabs.map((tab) => (tab.id === id ? { ...tab, query } : tab))
    );
  };

  const getCurrentTab = () => {
    return queryTabs.find((tab) => tab.id === activeTab);
  };

  return {
    queryTabs,
    activeTab,
    handleTabClick,
    handleTabClose,
    handleTabReorder,
    addNewTab,
    updateTabQuery,
    getCurrentTab,
  };
}
