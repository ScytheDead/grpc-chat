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
const clients = new Map();

function chat(call) {
  call.on('data', ChatMessage => {
    user = call.metadata.get('username');
    msg = ChatMessage.message;
    console.log(`${user} ==> ${msg}`);
    for (const [msgUser, userCall] of clients) {
      if (msgUser != user) {
        userCall.write(
          {
            from: user,
            message: msg,
          },
        );
      }
    }
    if (clients.get(user) === undefined) {
      clients.set(user, call);
    }
  });
  call.on('end', () => {
    const user = call.metadata.get('username');
    clients.delete(user);
    call.write({
      from: 'Chat server',
      message: 'Nice to see ya! Come back again...',
    });
    call.end();
  });
}

const server = new grpc.Server();
server.addService(grpcChat.ChatService.service, {
  chat,
});
server.bindAsync('0.0.0.0:50050', grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});

console.log('gRPC Chat Server started...');
