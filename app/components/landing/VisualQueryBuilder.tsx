"use client";

import { useState, useEffect, useRef, useReducer, JSX } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";
import { DemoView } from "./visualQueryBuilder/types";
import { getInitialStateForView, queryReducer, tabs } from "./visualQueryBuilder/queryStateUtils";
import { generateQuery } from "./visualQueryBuilder/queryGenerator";
import BaseQueryForm from "./visualQueryBuilder/BaseQueryForm";
import JoinConfiguration from "./visualQueryBuilder/JoinConfiguration";
import CaseStatement from "./visualQueryBuilder/CaseStatement";
import HavingClause from "./visualQueryBuilder/HavingClause";
import UnionOperation from "./visualQueryBuilder/UnionOperation";
import WithClause from "./visualQueryBuilder/WithClause";
import GeneratedSQL from "./visualQueryBuilder/GeneratedSQL";

interface VisualQueryBuilderProps {
  className?: string;
}

export default function VisualQueryBuilder({ className = "" }: VisualQueryBuilderProps) {
  const [activeView, setActiveView] = useState<DemoView>("joins");
  const containerRef = useRef<HTMLDivElement>(null);
  const [queryState, dispatch] = useReducer(queryReducer, getInitialStateForView("joins"));

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_VIEW", view: activeView });
  }, [activeView]);

  const featureContentMap: Record<DemoView, JSX.Element> = {
    joins: (
      <JoinConfiguration
        joinClauses={queryState.joinClauses}
        onUpdate={(index, field, value) =>
          dispatch({ type: "UPDATE_JOIN", index, field, value })
        }
      />
    ),
    case: (
      <CaseStatement
        caseConditions={queryState.caseConditions}
        onUpdate={(index, field, value) =>
          dispatch({ type: "UPDATE_CASE", index, field, value })
        }
      />
    ),
    having: (
      <HavingClause
        groupBy={queryState.groupBy}
        havingConditions={queryState.havingConditions}
        onGroupByUpdate={(value) =>
          dispatch({ type: "UPDATE_BASE", updates: { groupBy: value } })
        }
        onConditionUpdate={(index, field, value) =>
          dispatch({ type: "UPDATE_HAVING", index, field, value })
        }
      />
    ),
    union: (
      <UnionOperation
        unionClauses={queryState.unionClauses}
        onUpdate={(index, field, value) =>
          dispatch({ type: "UPDATE_UNION", index, field, value })
        }
      />
    ),
    with: (
      <WithClause
        withClauses={queryState.withClauses}
        onAliasUpdate={(index, alias) =>
          dispatch({ type: "UPDATE_WITH_ALIAS", index, alias })
        }
        onTableUpdate={(index, table) =>
          dispatch({ type: "UPDATE_WITH_TABLE", index, table })
        }
      />
    ),
  };

  return (
    <div ref={containerRef} className={`bg-gradient-to-br from-gray-900 to-purple-900 rounded-2xl p-4 sm:p-6 lg:p-8 border border-pink-500/30 shadow-2xl ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-4">
          Advanced Query Features
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                activeView === tab.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/50"
                  : "bg-gray-800/50 text-pink-200 hover:bg-gray-700/50 border border-pink-500/20"
              }`}
            >
              <span className="text-sm sm:text-base">{tab.label}</span>
              <span className="hidden lg:inline text-xs ml-2 opacity-70">· {tab.description}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-6">
          <BaseQueryForm
            queryState={queryState}
            onUpdate={(updates) => dispatch({ type: "UPDATE_BASE", updates })}
          />
          {featureContentMap[activeView]}
        </div>
        <GeneratedSQL query={generateQuery(queryState)} />
      </div>
    </div>
  );
}
