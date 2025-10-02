"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditorElement, useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash, Star } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {
  element: EditorElement;
};

const ProductsComponent = (props: Props) => {
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
  const title = content?.title || "Featured Products";

  // Sample product data - in a real app, this would come from your database
  const sampleProducts = [
    {
      id: 1,
      name: "Sample Product 1",
      price: "$29.99",
      image: "https://via.placeholder.com/300x200?text=Product+1",
      rating: 4.5,
    },
    {
      id: 2,
      name: "Sample Product 2",
      price: "$39.99",
      image: "https://via.placeholder.com/300x200?text=Product+2",
      rating: 4.2,
    },
    {
      id: 3,
      name: "Sample Product 3",
      price: "$49.99",
      image: "https://via.placeholder.com/300x200?text=Product+3",
      rating: 4.8,
    },
    {
      id: 4,
      name: "Sample Product 4",
      price: "$19.99",
      image: "https://via.placeholder.com/300x200?text=Product+4",
      rating: 4.0,
    },
  ];

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

      {/* Products Section Content */}
      <div className={`px-4 ${
        state.editor.device === 'Mobile' ? 'py-8' :
        state.editor.device === 'Tablet' ? 'py-12' : 'py-16'
      }`}>
        <div className="max-w-7xl mx-auto">
          <h2
            className={`font-bold text-center text-gray-900 ${
              state.editor.device === 'Mobile' ? 'text-xl mb-6' :
              state.editor.device === 'Tablet' ? 'text-2xl mb-8' : 'text-3xl mb-12'
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
                      title: target.innerText,
                    },
                  },
                },
              });
            }}
          >
            {title}
          </h2>

          {/* Products Grid */}
          <div className={`grid gap-4 ${
            state.editor.device === 'Mobile' ? 'grid-cols-1' :
            state.editor.device === 'Tablet' ? 'grid-cols-2' : 'grid-cols-4'
          }`}>
            {sampleProducts.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square overflow-hidden rounded-t-lg">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">
                      ({product.rating})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {product.price}
                    </span>
                    <Button 
                      size="sm" 
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
                                  buttonText: target.innerText,
                                },
                              },
                            },
                          });
                        }}
                        className={!state.editor.liveMode ? "cursor-text" : ""}
                      >
                        {content?.buttonText || 'Add to Cart'}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
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

export default ProductsComponent;
