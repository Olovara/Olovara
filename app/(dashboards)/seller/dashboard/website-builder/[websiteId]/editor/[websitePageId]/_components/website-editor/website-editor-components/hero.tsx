"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import React from "react";

type Props = {
  element: EditorElement;
};

const HeroComponent = (props: Props) => {
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
  const heading = content?.heading || "Welcome to Our Store";
  const subheading =
    content?.subheading || "Discover amazing products at great prices";
  const ctaText = content?.ctaText || "Shop Now";
  const ctaLink = content?.ctaLink || "#";
  const backgroundType = content?.backgroundType || "color";
  const backgroundColor = content?.backgroundColor || "#f3f4f6";
  const backgroundImage = content?.backgroundImage || "";

  const backgroundStyle =
    backgroundType === "image" && backgroundImage
      ? { backgroundImage: `url(${backgroundImage})` }
      : { backgroundColor };

  return (
    <div
      style={{ ...styles, ...backgroundStyle }}
      className={clsx(
        "p-[2px] w-full m-[5px] relative transition-all min-h-[400px] flex items-center justify-center",
        {
          "!border-blue-500":
            state.editor.selectedElement.id === props.element.id,
          "!border-solid": state.editor.selectedElement.id === props.element.id,
          "border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
        }
      )}
      onClick={handleOnClickBody}
    >
      {state.editor.selectedElement.id === props.element.id &&
        !state.editor.liveMode && (
          <Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg">
            {state.editor.selectedElement.name}
          </Badge>
        )}

      {/* Hero Content */}
      <div className={`text-center max-w-4xl mx-auto px-4 ${
        state.editor.device === 'Mobile' ? 'py-8' :
        state.editor.device === 'Tablet' ? 'py-12' : 'py-16'
      }`}>
        <h1
          className={`font-bold text-gray-900 mb-4 leading-tight ${
            state.editor.device === 'Mobile' ? 'text-2xl' :
            state.editor.device === 'Tablet' ? 'text-3xl' : 'text-4xl'
          }`}
          contentEditable={!state.editor.liveMode}
          onBlur={(e) => {
            const target = e.target as HTMLElement;
            dispatch({
              type: "UPDATE_ELEMENT",
              payload: {
                elementDetails: {
                  ...props.element,
                  content: {
                    ...content,
                    heading: target.innerText,
                  },
                },
              },
            });
          }}
        >
          {heading}
        </h1>

        <p
          className={`text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed ${
            state.editor.device === 'Mobile' ? 'text-base' :
            state.editor.device === 'Tablet' ? 'text-lg' : 'text-xl'
          }`}
          contentEditable={!state.editor.liveMode}
          onBlur={(e) => {
            const target = e.target as HTMLElement;
            dispatch({
              type: "UPDATE_ELEMENT",
              payload: {
                elementDetails: {
                  ...props.element,
                  content: {
                    ...content,
                    subheading: target.innerText,
                  },
                },
              },
            });
          }}
        >
          {subheading}
        </p>

        <Button
          size="lg"
          className={`bg-blue-600 hover:bg-blue-700 text-white py-3 transition-colors ${
            state.editor.device === 'Mobile' ? 'px-4 text-sm' :
            state.editor.device === 'Tablet' ? 'px-6 text-base' : 'px-8 text-lg'
          }`}
          disabled={!state.editor.liveMode}
          onClick={state.editor.liveMode ? undefined : (e) => e.preventDefault()}
        >
          <span
            contentEditable={!state.editor.liveMode}
            onBlur={(e) => {
              const target = e.target as HTMLElement;
              dispatch({
                type: "UPDATE_ELEMENT",
                payload: {
                  elementDetails: {
                    ...props.element,
                    content: {
                      ...content,
                      ctaText: target.innerText,
                    },
                  },
                },
              });
            }}
            className={!state.editor.liveMode ? "cursor-text" : ""}
          >
            {ctaText}
          </span>
        </Button>
      </div>

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

export default HeroComponent;
