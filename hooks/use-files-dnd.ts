import { useMemo } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useNexusStore } from '@/stores/use-nexus-store';

export function useFilesDnd() {
  const { files, updateFile } = useNexusStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const fileId = active.id as string;
      const folderId = over.id as string;

      const file = files.find(f => f.id === fileId);
      const folder = files.find(f => f.id === folderId);

      if (file && folder && folder.type === 'folder') {
        updateFile(fileId, { parentFolder: folderId });
      }
    }
  };

  return { sensors, handleDragEnd, DndContext };
}
