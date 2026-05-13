"use client";

import { useState, type ReactNode } from "react";
import styles from "./page.module.css";

type GeodeticTab = {
    label: string;
    children: ReactNode;
};

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

export function GeodeticTabs({ tabs }: { tabs: GeodeticTab[] }) {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <>
            <div className={styles.tabs} role="tablist" aria-label="Geodetic dashboard sections">
                {tabs.map((tab, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <button
                            aria-controls={`geodetic-tabpanel-${index}`}
                            aria-selected={isActive}
                            className={cx(styles.tab, isActive && styles.active)}
                            id={`geodetic-tab-${index}`}
                            key={tab.label}
                            onClick={() => setActiveIndex(index)}
                            role="tab"
                            type="button"
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {tabs.map((tab, index) => (
                <div
                    aria-labelledby={`geodetic-tab-${index}`}
                    className={cx(styles["tab-panel"], index === activeIndex && styles["tab-panel-active"])}
                    hidden={index !== activeIndex}
                    id={`geodetic-tabpanel-${index}`}
                    key={tab.label}
                    role="tabpanel"
                >
                    {tab.children}
                </div>
            ))}
        </>
    );
}
