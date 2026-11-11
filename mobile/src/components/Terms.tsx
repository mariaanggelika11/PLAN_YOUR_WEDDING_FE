import React from "react";
import { View } from "react-native";
import type { TermsDocument } from "../domain/contracts";
import { Card, H2, P, styles } from "./ui";
export function Terms({ document }: { document: TermsDocument }) {
  return (
    <Card>
      <H2>{document.title}</H2>
      <P muted>{document.version}</P>
      {document.content.map((block, index) =>
        block.kind === "paragraph" ? (
          <P key={index}>{block.text}</P>
        ) : (
          <View key={index} style={{ gap: 8 }}>
            {block.rows?.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={[
                  styles.row,
                  {
                    alignItems: "flex-start",
                    borderBottomWidth: 1,
                    borderColor: "#E7E5E4",
                    paddingVertical: 8,
                  },
                ]}
              >
                {row.map((cell, column) => (
                  <View key={column} style={{ flex: 1, minWidth: 70 }}>
                    <P>{cell}</P>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ),
      )}
    </Card>
  );
}
