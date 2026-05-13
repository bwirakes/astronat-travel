"use client";

import { useState, type ReactNode } from "react";
import styles from "./page.module.css";

type GeodeticTab = {
    label: string;
    id: string;
    children: ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

export function GeodeticTabs({ tabs }: { tabs: GeodeticTab[] }) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <>
            <div className={cx(styles.tabs, "tabs")}>
                {tabs.map((tab, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div
                            className={cx(styles.tab, "tab", isActive && styles.active, isActive && "active")}
                            key={tab.label}
                            onClick={() => setActiveIndex(index)}
                        >
                            {tab.label}
                        </div>
                    );
                })}
            </div>

            {tabs.map((tab, index) => (
                <div
                    className={cx(styles.pane, "pane", index === activeIndex && styles.active, index === activeIndex && "active")}
                    id={tab.id}
                    key={tab.label}
                >
                    {tab.children}
                </div>
            ))}
        </>
    );
}
