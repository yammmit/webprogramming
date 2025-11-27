import { authHandlers } from "./authHandlers";
import { userHandlers } from "./userHandlers";
import { groupHandlers } from "./groupHandlers";
import { invitationHandlers } from "./invitationHandlers";
import { taskHandlers } from "./taskHandlers";
import { assignmentHandlers } from "./assignmentHandlers";
import { evaluationHandlers } from "./evaluationHandlers";

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...groupHandlers,
  ...invitationHandlers,
  ...taskHandlers,
  ...assignmentHandlers,
  ...evaluationHandlers,
];
