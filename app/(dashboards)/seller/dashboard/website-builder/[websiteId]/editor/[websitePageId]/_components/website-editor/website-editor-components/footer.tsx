"use client";
import { Badge } from "@/components/ui/badge";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import React from "react";

type Props = {
  element: EditorElement;
};

const FooterComponent = (props: Props) => {
  const { dispatch, state } = useEditor();

  const handleDeleteElement = () => {
    dispatch({
      type: "DELETE_ELEMENT",
      payload: { elementDetails: props.element },
    });
  };

  const styles = props.element.styles;

  const handleOnClickBody = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: "CHANGE_CLICKED_ELEMENT",
      payload: {
        elementDetails: props.element,
      },
    });
  };

  // Get content from element, with fallbacks
  const content = props.element.content as any;
  const columns = content?.columns || [
    {
      header: "Quick Links",
      links: [
        { text: "Home", url: "#" },
        { text: "About", url: "#" },
        { text: "Contact", url: "#" },
      ],
    },
    {
      header: "Support",
      links: [
        { text: "Help Center", url: "#" },
        { text: "Shipping Info", url: "#" },
        { text: "Returns", url: "#" },
      ],
    },
    {
      header: "Legal",
      links: [
        { text: "Privacy Policy", url: "#" },
        { text: "Terms of Service", url: "#" },
        { text: "Cookie Policy", url: "#" },
      ],
    },
  ];

  const updateColumnHeader = (columnIndex: number, newHeader: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex] = { ...newColumns[columnIndex], header: newHeader };

    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...props.element,
          content: {
            ...content,
            columns: newColumns,
          },
        },
      },
    });
  };

  const updateLinkText = (
    columnIndex: number,
    linkIndex: number,
    newText: string
  ) => {
    const newColumns = [...columns];
    newColumns[columnIndex].links[linkIndex] = {
      ...newColumns[columnIndex].links[linkIndex],
      text: newText,
    };

    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...props.element,
          content: {
            ...content,
            columns: newColumns,
          },
        },
      },
    });
  };

  return (
    <div
      style={styles}
      className={clsx("p-[2px] w-full m-[5px] relative transition-all", {
        "!border-blue-500":
          state.editor.selectedElement.id === props.element.id,
        "!border-solid": state.editor.selectedElement.id === props.element.id,
        "border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
      })}
      onClick={handleOnClickBody}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg">
            {state.editor.selectedElement.name}
          </Badge>
        )}

      {/* Footer Content */}
      <footer className={`bg-gray-900 text-white ${
        state.editor.device === 'Mobile' ? 'py-6' :
        state.editor.device === 'Tablet' ? 'py-8' : 'py-12'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`grid gap-4 ${
            state.editor.device === 'Mobile' ? 'grid-cols-1' :
            state.editor.device === 'Tablet' ? 'grid-cols-2' : 'grid-cols-3'
          }`}>
            {columns.map((column: any, columnIndex: number) => (
              <div key={columnIndex} className={`${
                state.editor.device === 'Mobile' ? 'space-y-2' :
                state.editor.device === 'Tablet' ? 'space-y-3' : 'space-y-4'
              }`}>
                <h3
                  className={`font-semibold ${
                    state.editor.device === 'Mobile' ? 'text-sm' :
                    state.editor.device === 'Tablet' ? 'text-base' : 'text-lg'
                  }`}
                  contentEditable={!state.editor.liveMode}
                  onBlur={(e) => {
                    const target = e.target as HTMLElement;
                    updateColumnHeader(columnIndex, target.innerText);
                  }}
                >
                  {column.header}
                </h3>
                <ul className="space-y-2">
                  {column.links.map((link: any, linkIndex: number) => (
                    <li key={linkIndex}>
                      {state.editor.previewMode || state.editor.liveMode ? (
                        <a
                          href={link.url || '#'}
                          className={`text-gray-300 hover:text-white transition-colors ${
                            state.editor.device === 'Mobile' ? 'text-xs' :
                            state.editor.device === 'Tablet' ? 'text-sm' : 'text-base'
                          }`}
                        >
                          {link.text}
                        </a>
                      ) : (
                        <span
                          contentEditable={!state.editor.liveMode}
                          onBlur={(e) => {
                            const target = e.target as HTMLElement;
                            updateLinkText(
                              columnIndex,
                              linkIndex,
                              target.innerText
                            );
                          }}
                          className={`text-gray-300 cursor-text ${
                            state.editor.device === 'Mobile' ? 'text-xs' :
                            state.editor.device === 'Tablet' ? 'text-sm' : 'text-base'
                          }`}
                        >
                          {link.text}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer Bottom */}
          <div className={`border-t border-gray-800 text-center ${
            state.editor.device === 'Mobile' ? 'mt-4 pt-4' :
            state.editor.device === 'Tablet' ? 'mt-6 pt-6' : 'mt-8 pt-8'
          }`}>
            <p className={`text-gray-400 ${
              state.editor.device === 'Mobile' ? 'text-xs' :
              state.editor.device === 'Tablet' ? 'text-sm' : 'text-base'
            }`}>
              © {new Date().getFullYear()} Your Store. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <div className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
            <Trash
              className="cursor-pointer"
              size={16}
              onClick={handleDeleteElement}
            />
          </div>
        )}
    </div>
  );
};

export default FooterComponent;
