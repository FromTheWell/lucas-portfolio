export type TimelineKind = 'job' | 'project' | 'education' | 'award' | 'talk' | 'oss';


export interface TimelineLink {
label: string;
url: string;
rel?: string;
}


export interface TimelineItem {
id: string;
kind: TimelineKind;
title: string; // e.g., Senior Frontend @ Toools
org?: string; // e.g., JCCM, Client name
description?: string; // short summary
tech?: string[]; // Angular, PHP, Jenkins, Nx, Storybook
start: string; // ISO or yyyy-mm date
end?: string; // ISO or 'present'
highlight?: boolean; // emphasize key milestones
links?: TimelineLink[]; // case study, GitHub, demo
location?: string; // optional
}
