"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash, Heart, ShoppingCart, User } from "lucide-react";
import React from "react";

type Props = {
  element: EditorElement;
};

const NavbarComponent = (props: Props) => {
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
  const shopName = content?.shopName || "Your Shop";
  const showWishlist = content?.showWishlist !== false;
  const showCart = content?.showCart !== false;
  const showAccount = content?.showAccount !== false;

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

      {/* Navbar Content */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Shop Name */}
          <div className="flex items-center">
            <h1
              className={`font-bold text-gray-900 cursor-pointer ${
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
                        shopName: target.innerText,
                      },
                    },
                  },
                });
              }}
            >
              {shopName}
            </h1>
          </div>

          {/* Navigation Actions */}
          <div className={`flex items-center ${
            state.editor.device === 'Mobile' ? 'space-x-1' :
            state.editor.device === 'Tablet' ? 'space-x-2' : 'space-x-4'
          }`}>
            {showWishlist && (
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center p-2 ${
                  state.editor.device === 'Mobile' ? 'space-x-1 px-2' :
                  state.editor.device === 'Tablet' ? 'space-x-1 px-2' : 'space-x-2 px-3'
                }`}
                disabled={!state.editor.liveMode}
                onClick={state.editor.liveMode ? undefined : (e) => e.preventDefault()}
              >
                <Heart className="h-4 w-4" />
                <span 
                  className={`text-sm ${
                    state.editor.device === 'Mobile' ? 'hidden' :
                    state.editor.device === 'Tablet' ? 'inline' : 'inline'
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
                            wishlistText: target.innerText,
                          },
                        },
                      },
                    });
                  }}
                >
                  {content?.wishlistText || 'Wishlist'}
                </span>
              </Button>
            )}

            {showCart && (
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center p-2 ${
                  state.editor.device === 'Mobile' ? 'space-x-1 px-2' :
                  state.editor.device === 'Tablet' ? 'space-x-1 px-2' : 'space-x-2 px-3'
                }`}
                disabled={!state.editor.liveMode}
                onClick={state.editor.liveMode ? undefined : (e) => e.preventDefault()}
              >
                <ShoppingCart className="h-4 w-4" />
                <span 
                  className={`text-sm ${
                    state.editor.device === 'Mobile' ? 'hidden' :
                    state.editor.device === 'Tablet' ? 'inline' : 'inline'
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
                            cartText: target.innerText,
                          },
                        },
                      },
                    });
                  }}
                >
                  {content?.cartText || 'Cart'}
                </span>
              </Button>
            )}

            {showAccount && (
              <Button
                variant="ghost"
                size="sm"
                className={`flex items-center p-2 ${
                  state.editor.device === 'Mobile' ? 'space-x-1 px-2' :
                  state.editor.device === 'Tablet' ? 'space-x-1 px-2' : 'space-x-2 px-3'
                }`}
                disabled={!state.editor.liveMode}
                onClick={state.editor.liveMode ? undefined : (e) => e.preventDefault()}
              >
                <User className="h-4 w-4" />
                <span 
                  className={`text-sm ${
                    state.editor.device === 'Mobile' ? 'hidden' :
                    state.editor.device === 'Tablet' ? 'inline' : 'inline'
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
                            accountText: target.innerText,
                          },
                        },
                      },
                    });
                  }}
                >
                  {content?.accountText || 'Account'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </nav>

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

export default NavbarComponent;
