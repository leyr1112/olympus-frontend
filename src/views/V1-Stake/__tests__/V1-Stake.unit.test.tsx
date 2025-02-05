import { connectWallet } from "src/testHelpers";

import { render } from "../../../testUtils";
import V1Stake from "../V1-Stake";

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("<Stake/>", () => {
  it("should render component. not connected", async () => {
    const { container } = render(<V1Stake setMigrationModalOpen={false} />);
    expect(container).toMatchSnapshot();
  });

  it("should render the stake input Area when connected", async () => {
    connectWallet();
    const { container } = render(<V1Stake setMigrationModalOpen={false} />);
    expect(container).toMatchSnapshot();
  });

  it("should render the v1 migration modal", async () => {
    connectWallet();
    const { container } = render(<V1Stake setMigrationModalOpen={true} />);
    expect(container).toMatchSnapshot();
  });
  it("should render the v1 migration modal and banner", async () => {
    connectWallet();
    const { container } = render(<V1Stake setMigrationModalOpen={true} />);
    expect(container).toMatchSnapshot();
  });
});
