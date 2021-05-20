const PROTO_PATH = `${__dirname}/grpc_chat.proto`;
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
  PROTO_PATH,
  { keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true },
);
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const { grpcChat } = protoDescriptor.io.mark.grpc;
const client = new grpcChat.ChatService('localhost:50050',
  grpc.credentials.createInsecure());
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const user = process.argv[2];
const metadata = new grpc.Metadata();
metadata.add('username', user);
const call = client.chat(metadata);

call.on('data', ChatMessage => {
  console.log(`${ChatMessage.from} ==> ${ChatMessage.message}`);
});
call.on('end', () => {
  console.log('Server ended call');
});
call.on('error', e => {
  console.log(e);
});

rl.on('line', line => {
  if (line === 'quit') {
    call.end();
    rl.close();
  } else {
    call.write({
      message: line,
    });
  }
});

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  call.end();
  rl.close(process.exit);
});

console.log('Enter your messages below:');
