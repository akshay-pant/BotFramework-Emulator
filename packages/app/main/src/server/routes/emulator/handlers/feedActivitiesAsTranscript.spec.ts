//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from 'http-status-codes';

import { createFeedActivitiesAsTranscriptHandler } from './feedActivitiesAsTranscript';

const mockSocket = {
  send: jest.fn(),
};

jest.mock('../../../webSocketServer', () => {
  return {
    WebSocketServer: {
      sendToSubscribers: (...args) => mockSocket.send(...args),
    },
  };
});

describe('feedActivitiesAsTranscript handler', () => {
  it('should send a 200 after sending all activities over the web socket connection', () => {
    const req: any = {
      body: [
        {
          id: 'activity1',
          recipient: { role: 'user' },
        },
        {
          id: 'activity2',
          recipient: { role: 'user' },
        },
        {
          id: 'activity3',
          recipient: { role: 'user' },
        },
      ],
      params: {
        conversationId: 'convoId1',
      },
    };
    const res: any = {
      end: jest.fn(),
      send: jest.fn(),
    };
    const next = jest.fn();
    const mockConversation = {
      conversationId: 'convoId1',
      prepTranscriptActivities: jest.fn(activities => activities),
    };
    const mockEmulatorServer: any = {
      logger: {
        logActivity: jest.fn(),
      },
      state: {
        conversations: {
          conversationById: jest.fn(() => mockConversation),
        },
      },
    };
    const handler = createFeedActivitiesAsTranscriptHandler(mockEmulatorServer);
    handler(req, res, next);

    expect(res.send).toHaveBeenCalledWith(OK);
    expect(res.end).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(mockSocket.send).toHaveBeenCalledTimes(3);
  });

  it('should return a 500 with an error if something fails', () => {
    const req: any = {
      params: {
        conversationId: 'convoId1',
      },
    };
    const res: any = {
      send: jest.fn(),
    };
    const next = jest.fn();
    const mockEmulatorServer: any = {
      logger: {
        logActivity: jest.fn(),
      },
      state: {
        conversations: {
          conversationById: jest.fn(() => {
            throw new Error('An error occurred.');
          }),
        },
      },
    };
    const handler = createFeedActivitiesAsTranscriptHandler(mockEmulatorServer);
    handler(req, res, next);

    expect(res.send).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR, new Error('An error occurred.'));
    expect(next).toHaveBeenCalled();
  });

  it('should return a 400 if the specified conversation could not be found', () => {
    const req: any = {
      params: {
        conversationId: 'convoId1',
      },
    };
    const res: any = {
      send: jest.fn(),
    };
    const next = jest.fn();
    const mockEmulatorServer: any = {
      logger: {
        logActivity: jest.fn(),
      },
      state: {
        conversations: {
          conversationById: jest.fn(() => undefined),
        },
      },
    };
    const handler = createFeedActivitiesAsTranscriptHandler(mockEmulatorServer);
    handler(req, res, next);

    expect(res.send).toHaveBeenCalledWith(NOT_FOUND, 'Could not find conversation with id: convoId1');
    expect(next).toHaveBeenCalled();
  });
});
