import blessed from "blessed";

type Light = {
  id: number;
  r: number;
  g: number;
  b: number;
};

type Row = {
  frame: number;
  lights: Light[];
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

  const headerText = [
    "Frame",
    ...(rows.at(0)?.lights.map((l) => `L${l.id}`) ?? []),
  ];

  const formattedRows = [
    headerText,
    ...rows.map(({ frame, lights }) => [
      p(frame, 6),
      ...lights.map(({ r, g, b }) => `(${p(r, -3)},${p(g, -3)},${p(b, -3)})`),
    ]),
  ];

  table.setData(formattedRows);
  table.focus();
  screen.key(["q", "C-c", "escape"], function () {
    return process.exit(0);
  });

  screen.render();
}

function p(value: number, pad: number): string {
  const val = `${value.toFixed(0)}`;
  return pad < 0 ? val.padStart(Math.abs(pad)) : val.padEnd(pad);
}
