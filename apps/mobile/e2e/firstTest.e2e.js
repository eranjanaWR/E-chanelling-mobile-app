describe("App launch", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("shows login screen", async () => {
    await expect(element(by.text("E-Channeling"))).toBeVisible();
  });
});
