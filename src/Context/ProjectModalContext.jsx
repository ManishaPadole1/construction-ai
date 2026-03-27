import React, { createContext, useContext, useState } from 'react';

const ProjectModalContext = createContext();

export function ProjectModalProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [projectData, setProjectData] = useState(null);
    const [onSuccess, setOnSuccess] = useState(null);

    const openProjectModal = (data = null, callback = null) => {
        setProjectData(data);
        setOnSuccess(() => callback);
        setIsOpen(true);
    };

    const closeProjectModal = () => {
        setIsOpen(false);
        setProjectData(null);
        setOnSuccess(null);
    };

    return (
        <ProjectModalContext.Provider value={{ isOpen, projectData, openProjectModal, closeProjectModal, onSuccess }}>
            {children}
        </ProjectModalContext.Provider>
    );
}

export const useProjectModal = () => {
    const context = useContext(ProjectModalContext);
    if (!context) {
        throw new Error('useProjectModal must be used within a ProjectModalProvider');
    }
    return context;
};
