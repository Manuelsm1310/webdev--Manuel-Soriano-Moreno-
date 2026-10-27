const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');


const lectures = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'lectures.json'), 'utf8')
);


function textResult(id, text, isError) {
  return {
    jsonrpc: '2.0',
    id: id,
    result: {
      content: [{ type: 'text', text: text }],
      isError: isError,
    },
  };
}


const tools = [
  {
    name: 'find_lecture',
    description: 'Return the title and topics of one course lecture by its number, 1 to 12. Use it when asked what a specific lecture covers.',
    inputSchema: {
      type: 'object',
      properties: {
        number: { type: 'integer', description: 'Lecture number, from 1 to 12' },
      },
      required: ['number'],
    },
  },
  {
    name: 'search_lectures',
    description: 'Search course lectures by keyword in their title or topics. Use it when asked which lectures cover a specific subject or technology.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Word or topic to search for, e.g. HTTP or agents' },
      },
      required: ['keyword'],
    },
  },
];


function send(reply) {
  process.stdout.write(JSON.stringify(reply) + '\n');
}


function handle(msg) {
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: msg.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'lectures', version: '0.1.0' },
      },
    };
  }
  if (msg.method === 'notifications/initialized') {
    return null;
  }
  if (msg.method === 'tools/list') {
    return { jsonrpc: '2.0', id: msg.id, result: { tools: tools } };
  }
  if (msg.method === 'tools/call') {
    const name = msg.params.name;
    const args = msg.params.arguments || {};

    if (name === 'find_lecture') {
      const lecture = lectures.find((l) => l.number === args.number);
      if (!lecture) {

        return textResult(
          msg.id,
          'There is no lecture ' + args.number + '. The course has lectures 1 to 12.',
          true
        );
      }
      return textResult(
        msg.id,
        'Lecture ' + lecture.number + ': ' + lecture.title + '. Topics: ' + lecture.topics,
        false
      );
    }

    if (name === 'search_lectures') {
      const kw = String(args.keyword || '').toLowerCase();
      const matches = lectures.filter(
        (l) =>
          l.title.toLowerCase().includes(kw) ||
          l.topics.toLowerCase().includes(kw)
      );
      if (matches.length === 0) {
        return textResult(msg.id, 'No lectures found matching: ' + args.keyword, false);
      }
      const text = matches
        .map((l) => 'Lecture ' + l.number + ': ' + l.title + ' (' + l.topics + ')')
        .join('\n');
      return textResult(msg.id, text, false);
    }


    return {
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: -32602, message: 'Unknown tool: ' + name },
    };
  }


  if (msg.id !== undefined) {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      error: { code: -32601, message: 'Unknown method: ' + msg.method },
    };
  }

  return null;
}

const lines = readline.createInterface({ input: process.stdin });
lines.on('line', (line) => {
  console.error('got: ' + line);
  const reply = handle(JSON.parse(line));
  if (reply) send(reply);
});