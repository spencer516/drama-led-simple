import blessed from "blessed";

type Row = {
  frame: number;
  id: number;
  r: number;
  g: number;
  b: number;
};

const columns = {
  Frame: 8,
  Light: 8,
  Red: 5,
  Green: 5,
  Blue: 5,
};

export default function outputLightTable(rows: Row[]) {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Frames",
  });

  const header = blessed.box({
    top: 0,
    left: "center",
    width: "100%",
    height: 1,
    tags: true,
    content:
      "{bold}Press UP/DOWN, PAGEUP/PAGEDOWN, HOME/END to scroll. Press q, ESC or Ctrl-C to quit.{/bold}",
    style: {
      fg: "white",
      bg: "blue",
    },
  });

  screen.append(header);

  const table = blessed.listtable({
    parent: screen,
    top: 1,
    left: "left",
    width: "30",
    height: "100%-2",
    align: "left",
    tags: true,
    // table styling
    style: {
      header: { fg: "white", bold: true },
      cell: { fg: "white", selected: { bg: "green", bold: true } },
      border: { fg: "white" },
      focus: { border: { fg: "yellow" } },
    },
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: " ",
      track: {
        bg: "grey",
      },
      style: {
        bg: "white",
      },
    },
  });

  const formattedRows = [
    Object.entries(columns).map(([title, width]) => title.padEnd(width)),
    ...rows.map(({ frame, id, r, g, b }) => [
      p(frame, "Frame"),
      p(id, "Light"),
      p(r, "Red"),
      p(g, "Green"),
      p(b, "Blue"),
    ]),
  ];

  table.setData(formattedRows);
  table.focus();
  screen.key(["q", "C-c", "escape"], function () {
    return process.exit(0);
  });

  screen.render();
}

function p(value: number, column: keyof typeof columns): string {
  return `${value.toFixed(0)}`.padEnd(columns[column]);
}
