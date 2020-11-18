import { Paragraph } from './components/tools/paragraph/index';

interface WindowInterface extends Window {
  Paragraph: any;
}
(window as WindowInterface & typeof globalThis).Paragraph = Paragraph;
